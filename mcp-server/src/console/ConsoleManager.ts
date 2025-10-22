/**
 * Console Manager
 * 
 * Manages WebSocket connections from the Fresh UI console.
 * Handles real-time message broadcasting and command processing.
 */

import type { Logger, BeyondMcpServer } from '@beyondbetter/bb-mcp-server';
import { toError } from '@beyondbetter/bb-mcp-server';
import { MessageTracker } from './MessageTracker.ts';
import type {
  ConsoleMessage,
  ConsoleCommand,
  NotificationPayload,
  SamplingPayload,
  ElicitationPayload,
} from './types.ts';

export class ConsoleManager {
  private wsConnections: Map<string, WebSocket>;
  private mcpServer: BeyondMcpServer;
  private messageTracker: MessageTracker;
  private logger: Logger;

  constructor(
    mcpServer: BeyondMcpServer,
    messageTracker: MessageTracker,
    logger: Logger,
  ) {
    this.mcpServer = mcpServer;
    this.messageTracker = messageTracker;
    this.logger = logger;
    this.wsConnections = new Map();

    this.logger.info('ConsoleManager initialized');
  }

  /**
   * Handle WebSocket upgrade request
   */
  async handle(request: Request): Promise<Response> {
    // Check if this is a WebSocket upgrade request
    const upgrade = request.headers.get('upgrade');
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    try {
      const { socket, response } = Deno.upgradeWebSocket(request);
      const connectionId = crypto.randomUUID();

      socket.onopen = () => {
        this.handleConnection(connectionId, socket);
      };

      socket.onmessage = (event) => {
        this.handleMessage(connectionId, event.data);
      };

      socket.onclose = () => {
        this.handleDisconnection(connectionId);
      };

      socket.onerror = (error) => {
        this.logger.error(`WebSocket error for ${connectionId}:`, toError(error));
      };

      return response;
    } catch (error) {
      this.logger.error('Failed to upgrade WebSocket:', toError(error));
      return new Response('WebSocket upgrade failed', { status: 500 });
    }
  }

  /**
   * Handle new console connection
   */
  private handleConnection(connectionId: string, socket: WebSocket): void {
    this.wsConnections.set(connectionId, socket);
    this.logger.info(`Console client connected: ${connectionId}`);

    // Send welcome message
    this.sendToClient(connectionId, {
      type: 'connection_established',
      payload: {
        connectionId,
        timestamp: Date.now(),
        serverVersion: '1.0.0',
      },
    });

    // Send current client list
    this.sendClientListToAll();
  }

  /**
   * Handle console disconnection
   */
  private handleDisconnection(connectionId: string): void {
    this.wsConnections.delete(connectionId);
    this.logger.info(`Console client disconnected: ${connectionId}`);
    this.sendClientListToAll();
  }

  /**
   * Handle incoming message from console
   */
  private async handleMessage(connectionId: string, data: string): Promise<void> {
    try {
      const command = JSON.parse(data) as ConsoleCommand;
      this.logger.debug(`Console command from ${connectionId}:`, command.type);

      switch (command.type) {
        case 'trigger_notification':
          await this.triggerNotification(command.payload as NotificationPayload);
          break;

        case 'request_sampling':
          await this.requestSampling(command.payload as SamplingPayload);
          break;

        case 'request_elicitation':
          await this.requestElicitation(command.payload as ElicitationPayload);
          break;

        case 'get_clients':
          await this.sendClientList(connectionId);
          break;

        case 'get_message_history':
          await this.sendMessageHistory(connectionId, command.payload);
          break;

        default:
          this.logger.warn(`Unknown command type: ${command.type}`);
          this.sendToClient(connectionId, {
            type: 'error',
            payload: {
              message: `Unknown command type: ${command.type}`,
            },
          });
      }
    } catch (error) {
      this.logger.error('Error handling console message:', toError(error));
      this.sendToClient(connectionId, {
        type: 'error',
        payload: {
          message: 'Failed to process command',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Trigger notification to MCP clients
   */
  private async triggerNotification(payload: NotificationPayload): Promise<void> {
    try {
      this.logger.info('Triggering notification', { method: payload.method });

      await this.mcpServer.sendNotification(
        payload.method,
        payload.params,
      );

      this.broadcastMessage({
        type: 'notification_sent',
        payload: {
          method: payload.method,
          params: payload.params,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      this.logger.error('Error triggering notification:', toError(error));
      this.broadcastMessage({
        type: 'notification_error',
        payload: {
          message: 'Failed to send notification',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Request sampling from MCP client
   */
  private async requestSampling(payload: SamplingPayload): Promise<void> {
    try {
      this.logger.info('Requesting sampling from client');

      const response = await this.mcpServer.createMessage({
        messages: payload.messages,
        modelPreferences: payload.modelPreferences,
        systemPrompt: payload.systemPrompt,
        includeContext: payload.includeContext,
        temperature: payload.temperature,
        maxTokens: payload.maxTokens,
        stopSequences: payload.stopSequences,
        metadata: payload.metadata,
      });

      this.broadcastMessage({
        type: 'sampling_response',
        payload: response,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error('Error requesting sampling:', toError(error));
      this.broadcastMessage({
        type: 'sampling_error',
        payload: {
          message: 'Sampling request failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Request elicitation from MCP client
   */
  private async requestElicitation(payload: ElicitationPayload): Promise<void> {
    try {
      this.logger.info('Requesting elicitation from client');

      const response = await this.mcpServer.elicitInput({
        message: payload.message,
        requestedSchema: payload.requestedSchema,
      });

      this.broadcastMessage({
        type: 'elicitation_response',
        payload: response,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error('Error requesting elicitation:', toError(error));
      this.broadcastMessage({
        type: 'elicitation_error',
        payload: {
          message: 'Elicitation request failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Send client list to specific console
   */
  private async sendClientList(connectionId: string): Promise<void> {
    try {
      const clients = await this.messageTracker.getClients();
      this.sendToClient(connectionId, {
        type: 'client_list',
        payload: { clients },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error('Error getting client list:', toError(error));
      this.sendToClient(connectionId, {
        type: 'error',
        payload: {
          message: 'Failed to retrieve client list',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Send client list to all consoles
   */
  private async sendClientListToAll(): Promise<void> {
    try {
      const clients = await this.messageTracker.getClients();
      this.broadcastMessage({
        type: 'client_list',
        payload: { clients },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error('Error broadcasting client list:', toError(error));
    }
  }

  /**
   * Send message history to console
   */
  private async sendMessageHistory(
    connectionId: string,
    payload: any,
  ): Promise<void> {
    try {
      const messages = await this.messageTracker.getMessages(
        payload.sessionId || 'default',
        payload.limit || 100,
      );

      this.sendToClient(connectionId, {
        type: 'message_history',
        payload: { messages },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error('Error getting message history:', toError(error));
      this.sendToClient(connectionId, {
        type: 'error',
        payload: {
          message: 'Failed to retrieve message history',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Broadcast MCP protocol message to all consoles
   */
  broadcastMessage(message: ConsoleMessage): void {
    const payload = JSON.stringify(message);

    for (const [id, ws] of this.wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (error) {
          this.logger.error(`Error sending to console ${id}:`, toError(error));
        }
      }
    }
  }

  /**
   * Send message to specific console
   */
  private sendToClient(connectionId: string, message: ConsoleMessage): void {
    const ws = this.wsConnections.get(connectionId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        this.logger.error(`Error sending to console ${connectionId}:`, toError(error));
      }
    }
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.wsConnections.size;
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connectionCount: number;
    connections: Array<{ id: string; state: string }>;
  } {
    const connections = Array.from(this.wsConnections.entries()).map(([id, ws]) => ({
      id,
      state: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
    }));

    return {
      connectionCount: this.wsConnections.size,
      connections,
    };
  }
}
