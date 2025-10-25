/**
 * Message Tracker
 *
 * Tracks and stores MCP protocol messages for debugging and inspection.
 * Uses Deno KV for persistence with configurable retention and limits.
 */

import type { Logger } from '@beyondbetter/bb-mcp-server';
import type {
  ClientId,
  ClientInfo,
  McpMessage,
  MessageEntry,
  SessionId,
} from '@shared/types/index.ts';
import { toError } from '@shared/types/index.ts';

export class MessageTracker {
  private kv: Deno.Kv;
  private logger: Logger;
  private messageLimit: number;
  private retentionDays: number;

  constructor(kv: Deno.Kv, logger: Logger) {
    this.kv = kv;
    this.logger = logger;
    this.messageLimit = parseInt(
      Deno.env.get('MESSAGE_HISTORY_LIMIT') || '1000',
    );
    this.retentionDays = parseInt(
      Deno.env.get('MESSAGE_HISTORY_RETENTION_DAYS') || '7',
    );

    this.logger.info('MessageTracker: initialized', {
      messageLimit: this.messageLimit,
      retentionDays: this.retentionDays,
    });
  }

  /**
   * Track MCP protocol message
   */
  async trackMessage(
    sessionId: SessionId,
    direction: 'incoming' | 'outgoing',
    message: McpMessage,
  ): Promise<void> {
    const entry: MessageEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      sessionId,
      direction,
      message,
    };

    try {
      // Store message with composite key for efficient querying
      await this.kv.set(
        ['messages', sessionId, entry.timestamp.toString(), entry.id],
        entry,
      );

      this.logger.debug('MessageTracker: Tracked message', {
        direction,
        method: message.method || 'response',
        sessionId,
      });

      // Clean up old messages if needed (async, don't wait)
      this.cleanupOldMessages(sessionId).catch((error) => {
        this.logger.error(
          'MessageTracker: Error during message cleanup:',
          toError(error),
        );
      });
    } catch (error) {
      this.logger.error(
        'MessageTracker: Error tracking message:',
        toError(error),
      );
    }
  }

  /**
   * Get message history for session
   */
  async getMessages(
    sessionId: SessionId,
    limit: number = 100,
  ): Promise<MessageEntry[]> {
    const messages: MessageEntry[] = [];

    try {
      const iter = this.kv.list<MessageEntry>({
        prefix: ['messages', sessionId],
      });

      for await (const entry of iter) {
        messages.push(entry.value);
        if (messages.length >= limit) break;
      }

      // Sort by timestamp (ascending)
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      this.logger.error(
        'MessageTracker: Error getting messages:',
        toError(error),
      );
      return [];
    }
  }

  /**
   * Track MCP client connection
   */
  async trackClient(clientId: ClientId, info: ClientInfo): Promise<void> {
    try {
      await this.kv.set(
        ['clients', clientId],
        {
          ...info,
          lastSeen: Date.now(),
        },
      );

      this.logger.info('MessageTracker: Tracked client', {
        clientId,
        sessionId: info.sessionId,
      });
    } catch (error) {
      this.logger.error(
        'MessageTracker: Error tracking client:',
        toError(error),
      );
    }
  }

  /**
   * Get all tracked clients
   */
  async getClients(): Promise<ClientInfo[]> {
    const clients: ClientInfo[] = [];

    try {
      const iter = this.kv.list<ClientInfo>({
        prefix: ['clients'],
      });

      for await (const entry of iter) {
        clients.push(entry.value);
      }

      return clients;
    } catch (error) {
      this.logger.error(
        'MessageTracker: Error getting clients:',
        toError(error),
      );
      return [];
    }
  }

  /**
   * Remove client tracking
   */
  async removeClient(clientId: ClientId): Promise<void> {
    try {
      await this.kv.delete(['clients', clientId]);
      this.logger.info('MessageTracker: Removed client tracking', { clientId });
    } catch (error) {
      this.logger.error(
        'MessageTracker: Error removing client:',
        toError(error),
      );
    }
  }

  /**
   * Clean up old messages (private helper)
   */
  private async cleanupOldMessages(sessionId: SessionId): Promise<void> {
    try {
      const cutoffTime = Date.now() -
        (this.retentionDays * 24 * 60 * 60 * 1000);

      const iter = this.kv.list<MessageEntry>({
        prefix: ['messages', sessionId],
      });

      let count = 0;
      const toDelete: Deno.KvKey[] = [];

      for await (const entry of iter) {
        if (entry.value.timestamp < cutoffTime) {
          toDelete.push(entry.key);
        }
        count++;
      }

      // Delete old messages
      for (const key of toDelete) {
        await this.kv.delete(key);
      }

      if (toDelete.length > 0) {
        this.logger.info('MessageTracker: Cleaned up old messages', {
          sessionId,
          deleted: toDelete.length,
        });
      }

      // If still over limit, delete oldest messages
      if (count > this.messageLimit) {
        const messages = await this.getMessages(sessionId, count);
        const toDeleteCount = count - this.messageLimit;

        for (let i = 0; i < toDeleteCount && i < messages.length; i++) {
          await this.kv.delete([
            'messages',
            sessionId,
            messages[i].timestamp.toString(),
            messages[i].id,
          ]);
        }

        this.logger.info('MessageTracker: Trimmed message history', {
          sessionId,
          deleted: toDeleteCount,
        });
      }
    } catch (error) {
      this.logger.error(
        'MessageTracker: Error cleaning up messages:',
        toError(error),
      );
    }
  }

  /**
   * Clear all messages for a session
   */
  async clearSession(sessionId: SessionId): Promise<void> {
    try {
      const iter = this.kv.list<MessageEntry>({
        prefix: ['messages', sessionId],
      });

      let count = 0;
      for await (const entry of iter) {
        await this.kv.delete(entry.key);
        count++;
      }

      this.logger.info('MessageTracker: Cleared session messages', {
        sessionId,
        count,
      });
    } catch (error) {
      this.logger.error(
        'MessageTracker: Error clearing session:',
        toError(error),
      );
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    totalMessages: number;
    totalClients: number;
    sessionsWithMessages: number;
  }> {
    try {
      let totalMessages = 0;
      const sessions = new Set<string>();

      const messageIter = this.kv.list<MessageEntry>({
        prefix: ['messages'],
      });

      for await (const entry of messageIter) {
        totalMessages++;
        sessions.add(entry.value.sessionId);
      }

      const clientIter = this.kv.list<ClientInfo>({
        prefix: ['clients'],
      });

      let totalClients = 0;
      for await (const _ of clientIter) {
        totalClients++;
      }

      return {
        totalMessages,
        totalClients,
        sessionsWithMessages: sessions.size,
      };
    } catch (error) {
      this.logger.error(
        'MessageTracker: Error getting statistics:',
        toError(error),
      );
      return {
        totalMessages: 0,
        totalClients: 0,
        sessionsWithMessages: 0,
      };
    }
  }
}
