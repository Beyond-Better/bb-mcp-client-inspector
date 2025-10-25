/**
 * MessageTracker Tests
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { MessageTracker } from '../../../../mcp-server/src/console/MessageTracker.ts';
import {
  createSampleClientInfo,
  createTestKV,
  createTestLogger,
} from '../../../utils/test-helpers.ts';
import type { SessionId } from '@shared/types/index.ts';

describe('MessageTracker', () => {
  let kv: Deno.Kv;
  let tracker: MessageTracker;

  beforeEach(async () => {
    kv = await createTestKV();
    const logger = createTestLogger();
    tracker = new MessageTracker(kv, logger);
  });

  afterEach(async () => {
    await kv.close();
  });

  describe('trackMessage', () => {
    it('should track incoming message', async () => {
      const sessionId = 'test-session-1' as SessionId;
      const message = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/call',
        params: { name: 'echo', arguments: { message: 'test' } },
      };

      await tracker.trackMessage(sessionId, 'incoming', message);

      const messages = await tracker.getMessages(sessionId);
      assertEquals(messages.length, 1);
      assertEquals(messages[0].direction, 'incoming');
      assertEquals(messages[0].sessionId, sessionId);
    });

    it('should track outgoing message', async () => {
      const sessionId = 'test-session-1' as SessionId;
      const message = {
        jsonrpc: '2.0' as const,
        id: 1,
        result: { content: [{ type: 'text' as const, text: 'response' }] },
      };

      await tracker.trackMessage(sessionId, 'outgoing', message);

      const messages = await tracker.getMessages(sessionId);
      assertEquals(messages.length, 1);
      assertEquals(messages[0].direction, 'outgoing');
    });

    it('should track multiple messages', async () => {
      const sessionId = 'test-session-1' as SessionId;

      for (let i = 0; i < 5; i++) {
        await tracker.trackMessage(sessionId, 'incoming', {
          jsonrpc: '2.0' as const,
          id: i,
          method: 'test',
        });
      }

      const messages = await tracker.getMessages(sessionId);
      assertEquals(messages.length, 5);
    });

    it('should isolate messages by session', async () => {
      const session1 = 'session-1' as SessionId;
      const session2 = 'session-2' as SessionId;

      await tracker.trackMessage(session1, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test1',
      });
      await tracker.trackMessage(session2, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test2',
      });

      const messages1 = await tracker.getMessages(session1);
      const messages2 = await tracker.getMessages(session2);

      assertEquals(messages1.length, 1);
      assertEquals(messages2.length, 1);
      assertEquals(messages1[0].sessionId, session1);
      assertEquals(messages2[0].sessionId, session2);
    });

    it('should assign unique IDs to messages', async () => {
      const sessionId = 'test-session-1' as SessionId;

      await tracker.trackMessage(sessionId, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test1',
      });
      await tracker.trackMessage(sessionId, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test2',
      });

      const messages = await tracker.getMessages(sessionId);
      assertEquals(messages[0].id !== messages[1].id, true);
    });

    it('should include timestamp', async () => {
      const sessionId = 'test-session-1' as SessionId;
      const before = Date.now();

      await tracker.trackMessage(sessionId, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test',
      });

      const after = Date.now();
      const messages = await tracker.getMessages(sessionId);

      assertEquals(messages[0].timestamp >= before, true);
      assertEquals(messages[0].timestamp <= after, true);
    });
  });

  describe('getMessages', () => {
    it('should return empty array for non-existent session', async () => {
      const messages = await tracker.getMessages('non-existent' as SessionId);
      assertEquals(messages.length, 0);
    });

    it('should limit returned messages', async () => {
      const sessionId = 'test-session-1' as SessionId;

      for (let i = 0; i < 10; i++) {
        await tracker.trackMessage(sessionId, 'incoming', {
          jsonrpc: '2.0' as const,
          id: i,
          method: 'test',
        });
      }

      const messages = await tracker.getMessages(sessionId, 5);
      assertEquals(messages.length, 5);
    });

    it('should return messages in chronological order', async () => {
      const sessionId = 'test-session-1' as SessionId;

      for (let i = 0; i < 5; i++) {
        await tracker.trackMessage(sessionId, 'incoming', {
          jsonrpc: '2.0' as const,
          id: i,
          method: `test${i}`,
        });
      }

      const messages = await tracker.getMessages(sessionId);
      for (let i = 1; i < messages.length; i++) {
        assertEquals(messages[i].timestamp >= messages[i - 1].timestamp, true);
      }
    });
  });

  describe('trackClient', () => {
    it('should track client info', async () => {
      const clientInfo = createSampleClientInfo();

      await tracker.trackClient(clientInfo.clientId, clientInfo);

      const clients = await tracker.getClients();
      assertEquals(clients.length, 1);
      assertEquals(clients[0].clientId, clientInfo.clientId);
    });

    it('should track multiple clients', async () => {
      const client1 = createSampleClientInfo({ clientId: 'client-1' as any });
      const client2 = createSampleClientInfo({ clientId: 'client-2' as any });

      await tracker.trackClient(client1.clientId, client1);
      await tracker.trackClient(client2.clientId, client2);

      const clients = await tracker.getClients();
      assertEquals(clients.length, 2);
    });

    it('should update lastSeen timestamp', async () => {
      const clientInfo = createSampleClientInfo();
      const before = Date.now();

      await tracker.trackClient(clientInfo.clientId, clientInfo);

      const after = Date.now();
      const clients = await tracker.getClients();
      const tracked = clients[0];

      assertEquals(tracked.lastSeen >= before, true);
      assertEquals(tracked.lastSeen <= after, true);
    });
  });

  describe('getClients', () => {
    it('should return empty array when no clients tracked', async () => {
      const clients = await tracker.getClients();
      assertEquals(clients.length, 0);
    });

    it('should return all tracked clients', async () => {
      const client1 = createSampleClientInfo({ clientId: 'client-1' as any });
      const client2 = createSampleClientInfo({ clientId: 'client-2' as any });
      const client3 = createSampleClientInfo({ clientId: 'client-3' as any });

      await tracker.trackClient(client1.clientId, client1);
      await tracker.trackClient(client2.clientId, client2);
      await tracker.trackClient(client3.clientId, client3);

      const clients = await tracker.getClients();
      assertEquals(clients.length, 3);
    });
  });

  describe('removeClient', () => {
    it('should remove client tracking', async () => {
      const clientInfo = createSampleClientInfo();

      await tracker.trackClient(clientInfo.clientId, clientInfo);
      let clients = await tracker.getClients();
      assertEquals(clients.length, 1);

      await tracker.removeClient(clientInfo.clientId);
      clients = await tracker.getClients();
      assertEquals(clients.length, 0);
    });

    it('should not affect other clients', async () => {
      const client1 = createSampleClientInfo({ clientId: 'client-1' as any });
      const client2 = createSampleClientInfo({ clientId: 'client-2' as any });

      await tracker.trackClient(client1.clientId, client1);
      await tracker.trackClient(client2.clientId, client2);

      await tracker.removeClient(client1.clientId);

      const clients = await tracker.getClients();
      assertEquals(clients.length, 1);
      assertEquals(clients[0].clientId, client2.clientId);
    });
  });

  describe('clearSession', () => {
    it('should clear all messages for session', async () => {
      const sessionId = 'test-session-1' as SessionId;

      for (let i = 0; i < 5; i++) {
        await tracker.trackMessage(sessionId, 'incoming', {
          jsonrpc: '2.0' as const,
          id: i,
          method: 'test',
        });
      }

      let messages = await tracker.getMessages(sessionId);
      assertEquals(messages.length, 5);

      await tracker.clearSession(sessionId);
      messages = await tracker.getMessages(sessionId);
      assertEquals(messages.length, 0);
    });

    it('should not affect other sessions', async () => {
      const session1 = 'session-1' as SessionId;
      const session2 = 'session-2' as SessionId;

      await tracker.trackMessage(session1, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test1',
      });
      await tracker.trackMessage(session2, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test2',
      });

      await tracker.clearSession(session1);

      const messages1 = await tracker.getMessages(session1);
      const messages2 = await tracker.getMessages(session2);

      assertEquals(messages1.length, 0);
      assertEquals(messages2.length, 1);
    });
  });

  describe('getStatistics', () => {
    it('should return zero statistics initially', async () => {
      const stats = await tracker.getStatistics();
      assertEquals(stats.totalMessages, 0);
      assertEquals(stats.totalClients, 0);
      assertEquals(stats.sessionsWithMessages, 0);
    });

    it('should count messages correctly', async () => {
      const sessionId = 'test-session-1' as SessionId;

      for (let i = 0; i < 5; i++) {
        await tracker.trackMessage(sessionId, 'incoming', {
          jsonrpc: '2.0' as const,
          id: i,
          method: 'test',
        });
      }

      const stats = await tracker.getStatistics();
      assertEquals(stats.totalMessages, 5);
    });

    it('should count clients correctly', async () => {
      const client1 = createSampleClientInfo({ clientId: 'client-1' as any });
      const client2 = createSampleClientInfo({ clientId: 'client-2' as any });

      await tracker.trackClient(client1.clientId, client1);
      await tracker.trackClient(client2.clientId, client2);

      const stats = await tracker.getStatistics();
      assertEquals(stats.totalClients, 2);
    });

    it('should count sessions with messages', async () => {
      const session1 = 'session-1' as SessionId;
      const session2 = 'session-2' as SessionId;

      await tracker.trackMessage(session1, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test1',
      });
      await tracker.trackMessage(session2, 'incoming', {
        jsonrpc: '2.0' as const,
        method: 'test2',
      });

      const stats = await tracker.getStatistics();
      assertEquals(stats.sessionsWithMessages, 2);
    });
  });
});
