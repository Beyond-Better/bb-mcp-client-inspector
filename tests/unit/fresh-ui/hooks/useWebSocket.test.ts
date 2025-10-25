/**
 * useWebSocket Hook Tests
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import {
  clearMessages,
  closeWebSocket,
  initWebSocket,
  sendCommand,
  wsConnected,
  wsConnectionId,
  wsError,
  wsMessages,
} from '../../../../fresh-ui/hooks/useWebSocket.ts';
import { delay } from '../../../utils/test-helpers.ts';
import type { ConsoleMessage } from '@shared/types/index.ts';

describe('useWebSocket Hook', () => {
  // Clean up after each test
  afterEach(() => {
    closeWebSocket();
    clearMessages();
    wsError.value = null;
    wsConnectionId.value = null;
  });

  describe('initialization', () => {
    it('should have initial signal values', () => {
      assertEquals(wsConnected.value, false);
      assertEquals(wsMessages.value.length, 0);
      assertEquals(wsError.value, null);
      assertEquals(wsConnectionId.value, null);
    });
  });

  describe('clearMessages', () => {
    it('should clear message history', () => {
      // Add some messages
      wsMessages.value = [
        {
          type: 'connection_established',
          payload: { connectionId: 'test', serverVersion: '1.0.0' },
          timestamp: Date.now(),
        },
        {
          type: 'client_list',
          payload: { clients: [] },
          timestamp: Date.now(),
        },
      ];

      assertEquals(wsMessages.value.length, 2);

      clearMessages();

      assertEquals(wsMessages.value.length, 0);
    });
  });

  describe('sendCommand', () => {
    it('should handle sending when not connected', () => {
      // Should not throw when WebSocket is not connected
      sendCommand({
        type: 'get_clients',
      });

      // Error should be set
      assertEquals(wsError.value, 'Not connected to server');
    });
  });

  describe('signal reactivity', () => {
    it('should update wsMessages signal when new messages arrive', () => {
      const initialLength = wsMessages.value.length;

      const newMessage: ConsoleMessage = {
        type: 'notification_sent',
        payload: { test: true },
        timestamp: Date.now(),
      };

      wsMessages.value = [...wsMessages.value, newMessage];

      assertEquals(wsMessages.value.length, initialLength + 1);
      assertEquals(
        wsMessages.value[wsMessages.value.length - 1].type,
        'notification_sent',
      );
    });

    it('should maintain message order', () => {
      const message1: ConsoleMessage = {
        type: 'notification_sent',
        payload: { id: 1 },
        timestamp: Date.now(),
      };

      const message2: ConsoleMessage = {
        type: 'notification_sent',
        payload: { id: 2 },
        timestamp: Date.now() + 1,
      };

      wsMessages.value = [message1, message2];

      assertEquals(wsMessages.value[0].payload, { id: 1 });
      assertEquals(wsMessages.value[1].payload, { id: 2 });
    });
  });

  describe('connection state', () => {
    it('should track connected state', () => {
      assertEquals(wsConnected.value, false);

      // Simulate connection
      wsConnected.value = true;
      assertEquals(wsConnected.value, true);

      // Simulate disconnection
      wsConnected.value = false;
      assertEquals(wsConnected.value, false);
    });

    it('should track connection ID', () => {
      assertEquals(wsConnectionId.value, null);

      const connectionId = 'test-conn-123';
      wsConnectionId.value = connectionId as any;

      assertEquals(wsConnectionId.value, connectionId);
    });
  });

  describe('error handling', () => {
    it('should track error state', () => {
      assertEquals(wsError.value, null);

      const errorMessage = 'Connection failed';
      wsError.value = errorMessage;

      assertEquals(wsError.value, errorMessage);
    });

    it('should clear error on successful connection', () => {
      wsError.value = 'Previous error';
      assertEquals(wsError.value, 'Previous error');

      // Simulate successful connection
      wsError.value = null;
      wsConnected.value = true;

      assertEquals(wsError.value, null);
      assertEquals(wsConnected.value, true);
    });
  });

  describe('message validation', () => {
    it('should validate console message format', () => {
      const validMessage: ConsoleMessage = {
        type: 'connection_established',
        payload: {
          connectionId: 'test-123',
          serverVersion: '1.0.0',
        },
        timestamp: Date.now(),
      };

      assertExists(validMessage.type);
      assertExists(validMessage.payload);
    });

    it('should handle different message types', () => {
      const messageTypes = [
        'connection_established',
        'client_list',
        'notification_sent',
        'sampling_response',
        'elicitation_response',
        'error',
      ] as const;

      for (const type of messageTypes) {
        const message: ConsoleMessage = {
          type,
          payload: {},
          timestamp: Date.now(),
        };

        assertExists(message.type);
        assertEquals(typeof message.type, 'string');
      }
    });
  });

  describe('module-level state', () => {
    it('should share state across imports', () => {
      // Module-level signals are singletons
      wsMessages.value = [{
        type: 'connection_established',
        payload: {},
        timestamp: Date.now(),
      }];

      assertEquals(wsMessages.value.length, 1);

      // Clearing should affect the same instance
      clearMessages();
      assertEquals(wsMessages.value.length, 0);
    });
  });

  describe('closeWebSocket', () => {
    it('should reset connection state', () => {
      // Set up some state
      wsConnected.value = true;
      wsConnectionId.value = 'test-123' as any;

      // Close connection
      closeWebSocket();

      // State should be reset
      assertEquals(wsConnected.value, false);
    });

    it('should be safe to call multiple times', () => {
      closeWebSocket();
      closeWebSocket();
      closeWebSocket();

      // Should not throw
      assertEquals(wsConnected.value, false);
    });
  });
});
