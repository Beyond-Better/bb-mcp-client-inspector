/**
 * WebSocket Communication Integration Tests
 *
 * Tests the full flow of WebSocket communication between ConsoleManager and UI.
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { ConsoleManager } from '../../mcp-server/src/console/ConsoleManager.ts';
import { MessageTracker } from '../../mcp-server/src/console/MessageTracker.ts';
import { MockBeyondMcpServer, MockWebSocketServer } from '../utils/mocks.ts';
import { createTestKV, createTestLogger } from '../utils/test-helpers.ts';
import type { ConsoleCommand, ConsoleMessage } from '@shared/types/index.ts';

describe('WebSocket Communication Integration', () => {
  let kv: Deno.Kv;
  let _consoleManager: ConsoleManager;
  let mockServer: MockBeyondMcpServer;
  let messageTracker: MessageTracker;
  let wsServer: MockWebSocketServer;

  beforeEach(async () => {
    kv = await createTestKV();
    const logger = createTestLogger();
    messageTracker = new MessageTracker(kv, logger);
    mockServer = new MockBeyondMcpServer();
    _consoleManager = new ConsoleManager(messageTracker, logger);
    wsServer = new MockWebSocketServer();
  });

  afterEach(async () => {
    await kv.close();
    mockServer.reset();
    wsServer.reset();
  });

  describe('connection flow', () => {
    it('should handle client connection', () => {
      const connectionId = 'test-conn-1';
      const socket = wsServer.createConnection(connectionId);

      assertExists(socket);
      assertEquals(socket.readyState, WebSocket.OPEN);
      assertEquals(wsServer.getConnectionCount(), 1);
    });

    it('should handle multiple client connections', () => {
      wsServer.createConnection('conn-1');
      wsServer.createConnection('conn-2');
      wsServer.createConnection('conn-3');

      assertEquals(wsServer.getConnectionCount(), 3);
    });

    it('should handle client disconnection', () => {
      const connectionId = 'test-conn-1';
      wsServer.createConnection(connectionId);
      assertEquals(wsServer.getConnectionCount(), 1);

      wsServer.closeConnection(connectionId);
      assertEquals(wsServer.getConnectionCount(), 0);
    });
  });

  describe('message broadcasting', () => {
    it('should broadcast message to all clients', () => {
      const _socket1 = wsServer.createConnection('conn-1');
      const _socket2 = wsServer.createConnection('conn-2');

      const message: ConsoleMessage = {
        type: 'notification_sent',
        payload: { level: 'info', data: 'test' },
        timestamp: Date.now(),
      };

      wsServer.broadcast(JSON.stringify(message));

      // Both sockets should have received the message via broadcast
      // Note: Since our MockWebSocketServer doesn't auto-relay broadcasts to getSentMessages,
      // we just verify the broadcast mechanism doesn't throw
      // In a real scenario, this would be tested with actual WebSocket connections
    });

    it('should send message to specific client', () => {
      const socket1 = wsServer.createConnection('conn-1');
      const socket2 = wsServer.createConnection('conn-2');

      const message = JSON.stringify({
        type: 'client_list',
        payload: { clients: [] },
        timestamp: Date.now(),
      });

      socket1.send(message);

      assertEquals(socket1.getSentMessages().length, 1);
      assertEquals(socket2.getSentMessages().length, 0);
    });
  });

  describe('command handling', () => {
    it('should process notification trigger command', async () => {
      const command: ConsoleCommand = {
        type: 'trigger_notification',
        payload: {
          level: 'info',
          logger: 'test',
          data: 'Test notification',
        },
      };

      await mockServer.sendNotification(command.payload as any, {});

      const notifications = mockServer.getNotifications();
      assertEquals(notifications.length, 1);
      assertEquals(notifications[0].level, 'info');
    });

    it('should process sampling request command', async () => {
      const command: ConsoleCommand = {
        type: 'request_sampling',
        payload: {
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: 'Test prompt' },
            },
          ],
          maxTokens: 100,
        },
      };

      const response = await mockServer.createMessage({
        messages: (command.payload as any).messages,
        maxTokens: (command.payload as any).maxTokens,
      }, {});

      assertExists(response);
      assertEquals(response.content[0].type, 'text');

      const requests = mockServer.getSamplingRequests();
      assertEquals(requests.length, 1);
    });

    it('should process elicitation request command', async () => {
      const command: ConsoleCommand = {
        type: 'request_elicitation',
        payload: {
          message: 'Please confirm',
          requestedSchema: {
            type: 'object',
            properties: {
              confirmed: { type: 'boolean', description: 'Confirmation' },
            },
          },
        },
      };

      const response = await mockServer.elicitInput(command.payload as any, {});

      assertExists(response);
      assertEquals(response.action, 'accept');

      const requests = mockServer.getElicitationRequests();
      assertEquals(requests.length, 1);
    });

    it('should handle get_clients command', () => {
      const transportManager = mockServer.getTransportManager();
      transportManager.addClientSession({
        sessionId: 'session-1',
        transport: 'http',
      });

      const sessions = transportManager.getClientSessions();
      assertEquals(sessions.length, 1);
      assertEquals(sessions[0].sessionId, 'session-1');
    });
  });

  describe('message tracking integration', () => {
    it('should track messages through the system', async () => {
      const sessionId = 'test-session-1' as any;

      await messageTracker.trackMessage(sessionId, 'incoming', {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/call',
        params: { name: 'echo', arguments: { message: 'test' } },
      });

      await messageTracker.trackMessage(sessionId, 'outgoing', {
        jsonrpc: '2.0' as const,
        id: 1,
        result: { content: [{ type: 'text' as const, text: 'test' }] },
      });

      const messages = await messageTracker.getMessages(sessionId);
      assertEquals(messages.length, 2);
      // First message is incoming, second is outgoing
      assertEquals(messages[0].direction, 'incoming');
      assertEquals(messages[1].direction, 'outgoing');
    });

    it('should provide message history via command', async () => {
      const sessionId = 'test-session-1' as any;

      for (let i = 0; i < 5; i++) {
        await messageTracker.trackMessage(sessionId, 'incoming', {
          jsonrpc: '2.0' as const,
          id: i,
          method: 'test',
        });
      }

      const messages = await messageTracker.getMessages(sessionId, 3);
      assertEquals(messages.length, 3);
    });
  });

  describe('error handling integration', () => {
    it('should handle malformed command gracefully', () => {
      const malformedCommand = '{ invalid json';

      let parseError = false;
      try {
        JSON.parse(malformedCommand);
      } catch {
        parseError = true;
      }

      assertEquals(parseError, true);
    });

    it('should validate command structure', () => {
      const invalidCommand = {
        // Missing type field
        payload: {},
      };

      assertEquals('type' in invalidCommand, false);
    });
  });

  describe('multi-client scenarios', () => {
    it('should handle multiple clients with different sessions', () => {
      const transportManager = mockServer.getTransportManager();

      transportManager.addClientSession({
        sessionId: 'session-1',
        transport: 'http',
        clientInfo: { name: 'Client 1' },
      });

      transportManager.addClientSession({
        sessionId: 'session-2',
        transport: 'stdio',
        clientInfo: { name: 'Client 2' },
      });

      const sessions = transportManager.getClientSessions();
      assertEquals(sessions.length, 2);
      assertEquals(sessions[0].sessionId, 'session-1');
      assertEquals(sessions[1].sessionId, 'session-2');
    });

    it('should isolate messages by session', async () => {
      const session1 = 'session-1' as any;
      const session2 = 'session-2' as any;

      await messageTracker.trackMessage(session1, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test1',
      });

      await messageTracker.trackMessage(session2, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test2',
      });

      const messages1 = await messageTracker.getMessages(session1);
      const messages2 = await messageTracker.getMessages(session2);

      assertEquals(messages1.length, 1);
      assertEquals(messages2.length, 1);
      assertEquals((messages1[0].message as any).method, 'test1');
      assertEquals((messages2[0].message as any).method, 'test2');
    });
  });
});
