/**
 * Message Flow Integration Tests
 *
 * Tests end-to-end message flows through the system.
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { MessageTracker } from '../../mcp-server/src/console/MessageTracker.ts';
import { MockBeyondMcpServer } from '../utils/mocks.ts';
import { createTestKV, createTestLogger } from '../utils/test-helpers.ts';
import type { SessionId } from '@shared/types/index.ts';

describe('Message Flow Integration', () => {
  let kv: Deno.Kv;
  let messageTracker: MessageTracker;
  let mockServer: MockBeyondMcpServer;

  beforeEach(async () => {
    kv = await createTestKV();
    const logger = createTestLogger();
    messageTracker = new MessageTracker(kv, logger);
    mockServer = new MockBeyondMcpServer();
  });

  afterEach(async () => {
    await kv.close();
    mockServer.reset();
  });

  describe('tool call flow', () => {
    it('should track complete tool call flow', async () => {
      const sessionId = 'test-session-1' as SessionId;

      // Track incoming tool call request
      await messageTracker.trackMessage(sessionId, 'incoming', {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/call',
        params: {
          name: 'echo',
          arguments: { message: 'Hello, World!' },
        },
      });

      // Track outgoing tool call response
      await messageTracker.trackMessage(sessionId, 'outgoing', {
        jsonrpc: '2.0' as const,
        id: 1,
        result: {
          content: [
            {
              type: 'text' as const,
              text: 'Hello, World!',
            },
          ],
        },
      });

      const messages = await messageTracker.getMessages(sessionId);
      assertEquals(messages.length, 2);
      assertEquals(messages[0].direction, 'incoming');
      assertEquals(messages[1].direction, 'outgoing');
      assertEquals((messages[0].message as any).method, 'tools/call');
    });

    it('should track multiple sequential tool calls', async () => {
      const sessionId = 'test-session-1' as SessionId;

      // Multiple tool calls
      for (let i = 0; i < 3; i++) {
        await messageTracker.trackMessage(sessionId, 'incoming', {
          jsonrpc: '2.0' as const,
          id: i,
          method: 'tools/call',
          params: { name: 'echo', arguments: { message: `Test ${i}` } },
        });

        await messageTracker.trackMessage(sessionId, 'outgoing', {
          jsonrpc: '2.0' as const,
          id: i,
          result: { content: [{ type: 'text' as const, text: `Test ${i}` }] },
        });
      }

      const messages = await messageTracker.getMessages(sessionId);
      assertEquals(messages.length, 6); // 3 requests + 3 responses
    });
  });

  describe('notification flow', () => {
    it('should handle notification lifecycle', async () => {
      const sessionId = 'test-session-1' as SessionId;

      // Trigger notification
      await mockServer.sendNotification(
        {
          level: 'info',
          logger: 'test',
          data: 'Test notification',
        },
        { sessionId },
      );

      const notifications = mockServer.getNotifications();
      assertEquals(notifications.length, 1);
      assertEquals(notifications[0].level, 'info');
      assertEquals(notifications[0].options.sessionId, sessionId);
    });

    it('should handle multiple notifications', async () => {
      const sessionId = 'test-session-1' as SessionId;

      const levels = ['debug', 'info', 'warning', 'error'] as const;

      for (const level of levels) {
        await mockServer.sendNotification(
          { level, logger: 'test', data: `${level} message` },
          { sessionId },
        );
      }

      const notifications = mockServer.getNotifications();
      assertEquals(notifications.length, 4);
    });
  });

  describe('sampling flow', () => {
    it('should handle complete sampling flow', async () => {
      const sessionId = 'test-session-1' as SessionId;

      // Request sampling
      const response = await mockServer.createMessage(
        {
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: 'What is 2+2?' },
            },
          ],
          maxTokens: 100,
        },
        { sessionId },
      );

      assertExists(response);
      assertEquals(response.content[0].type, 'text');
      assertEquals(response.stopReason, 'endTurn');

      const requests = mockServer.getSamplingRequests();
      assertEquals(requests.length, 1);
      assertEquals(requests[0].options.sessionId, sessionId);
    });

    it('should handle sampling with model preferences', async () => {
      const response = await mockServer.createMessage({
        model: 'test-model',
        messages: [
          { role: 'user', content: { type: 'text', text: 'test' } },
        ],
        maxTokens: 50,
      }, {});

      assertEquals(response.model, 'test-model');
    });

    it('should handle multiple sampling requests', async () => {
      const sessionId = 'test-session-1' as SessionId;

      for (let i = 0; i < 3; i++) {
        await mockServer.createMessage(
          {
            messages: [
              { role: 'user', content: { type: 'text', text: `Query ${i}` } },
            ],
            maxTokens: 100,
          },
          { sessionId },
        );
      }

      const requests = mockServer.getSamplingRequests();
      assertEquals(requests.length, 3);
    });
  });

  describe('elicitation flow', () => {
    it('should handle complete elicitation flow', async () => {
      const sessionId = 'test-session-1' as SessionId;

      const response = await mockServer.elicitInput(
        {
          message: 'Please confirm',
          requestedSchema: {
            type: 'object',
            properties: {
              confirmed: { type: 'boolean', description: 'Confirmation' },
            },
          },
        },
        { sessionId },
      );

      assertExists(response);
      assertEquals(response.action, 'accept');
      assertExists(response.content);

      const requests = mockServer.getElicitationRequests();
      assertEquals(requests.length, 1);
      assertEquals(requests[0].options.sessionId, sessionId);
    });

    it('should handle elicitation without schema', async () => {
      const response = await mockServer.elicitInput({
        message: 'Simple confirmation',
      }, {});

      assertEquals(response.action, 'accept');
    });
  });

  describe('session isolation', () => {
    it('should isolate messages between sessions', async () => {
      const session1 = 'session-1' as SessionId;
      const session2 = 'session-2' as SessionId;

      // Session 1 messages
      await messageTracker.trackMessage(session1, 'incoming', {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/call',
      });

      // Session 2 messages
      await messageTracker.trackMessage(session2, 'incoming', {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/call',
      });

      const messages1 = await messageTracker.getMessages(session1);
      const messages2 = await messageTracker.getMessages(session2);

      assertEquals(messages1.length, 1);
      assertEquals(messages2.length, 1);
      assertEquals(messages1[0].sessionId, session1);
      assertEquals(messages2[0].sessionId, session2);
    });

    it('should handle concurrent operations on different sessions', async () => {
      const session1 = 'session-1' as SessionId;
      const session2 = 'session-2' as SessionId;

      // Concurrent operations
      await Promise.all([
        messageTracker.trackMessage(session1, 'incoming', {
          jsonrpc: '2.0' as const,
          method: 'test1',
        }),
        messageTracker.trackMessage(session2, 'incoming', {
          jsonrpc: '2.0' as const,
          method: 'test2',
        }),
        mockServer.sendNotification({ level: 'info', data: 'test' }, { sessionId: session1 }),
        mockServer.sendNotification({ level: 'info', data: 'test' }, { sessionId: session2 }),
      ]);

      const messages1 = await messageTracker.getMessages(session1);
      const messages2 = await messageTracker.getMessages(session2);
      const notifications = mockServer.getNotifications();

      assertEquals(messages1.length, 1);
      assertEquals(messages2.length, 1);
      assertEquals(notifications.length, 2);
    });
  });

  describe('statistics and reporting', () => {
    it('should track statistics across sessions', async () => {
      const session1 = 'session-1' as SessionId;
      const session2 = 'session-2' as SessionId;

      await messageTracker.trackMessage(session1, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test',
      });
      await messageTracker.trackMessage(session2, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test',
      });

      const stats = await messageTracker.getStatistics();
      assertEquals(stats.totalMessages, 2);
      assertEquals(stats.sessionsWithMessages, 2);
    });

    it('should track client connections', async () => {
      const client1 = {
        clientId: 'client-1' as any,
        sessionId: 'session-1' as any,
        connectedAt: Date.now(),
        lastSeen: Date.now(),
        transport: 'http' as const,
      };

      const client2 = {
        clientId: 'client-2' as any,
        sessionId: 'session-2' as any,
        connectedAt: Date.now(),
        lastSeen: Date.now(),
        transport: 'stdio' as const,
      };

      await messageTracker.trackClient(client1.clientId, client1);
      await messageTracker.trackClient(client2.clientId, client2);

      const stats = await messageTracker.getStatistics();
      assertEquals(stats.totalClients, 2);

      const clients = await messageTracker.getClients();
      assertEquals(clients.length, 2);
    });
  });

  describe('cleanup operations', () => {
    it('should clear session data', async () => {
      const sessionId = 'test-session-1' as SessionId;

      for (let i = 0; i < 5; i++) {
        await messageTracker.trackMessage(sessionId, 'incoming', {
          jsonrpc: '2.0' as const,
          id: i,
          method: 'test',
        });
      }

      let messages = await messageTracker.getMessages(sessionId);
      assertEquals(messages.length, 5);

      await messageTracker.clearSession(sessionId);

      messages = await messageTracker.getMessages(sessionId);
      assertEquals(messages.length, 0);
    });

    it('should remove client tracking', async () => {
      const clientId = 'test-client-1' as any;
      const clientInfo = {
        clientId,
        sessionId: 'session-1' as any,
        connectedAt: Date.now(),
        lastSeen: Date.now(),
        transport: 'http' as const,
      };

      await messageTracker.trackClient(clientId, clientInfo);

      let clients = await messageTracker.getClients();
      assertEquals(clients.length, 1);

      await messageTracker.removeClient(clientId);

      clients = await messageTracker.getClients();
      assertEquals(clients.length, 0);
    });
  });
});
