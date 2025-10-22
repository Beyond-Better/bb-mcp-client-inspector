/**
 * WebSocket Hook - Module-Scoped Signals
 *
 * Manages WebSocket connection to MCP server console endpoint.
 * Uses module-level signals for shared state across all components.
 * Call initWebSocket() once from Console.tsx to establish connection.
 */

import { signal } from "@preact/signals";
import type {
  ConnectionId,
  ConsoleCommand,
  ConsoleMessage,
} from "@shared/types/index.ts";
import {
  isConnectionEstablished,
  isConsoleMessage,
} from "@shared/types/index.ts";

// Module-level signals (shared singleton state)
export const wsConnected = signal(false);
export const wsMessages = signal<ConsoleMessage[]>([]);
export const wsError = signal<string | null>(null);
export const wsConnectionId = signal<ConnectionId | null>(null);

// Module-level WebSocket instance
let ws: WebSocket | null = null;
let reconnectTimeout: number | null = null;
let reconnectAttempts = 0;
let currentUrl: string | null = null;

/**
 * Initialize WebSocket connection
 * Call this once from Console.tsx useEffect
 */
export function initWebSocket(url: string): void {
  // Prevent double initialization
  if (ws && ws.readyState === WebSocket.OPEN && currentUrl === url) {
    console.log("[WebSocket] Already connected");
    return;
  }

  // Close existing connection if URL changed
  if (ws && currentUrl !== url) {
    console.log("[WebSocket] URL changed, closing existing connection");
    closeWebSocket();
  }

  currentUrl = url;
  connect();
}

/**
 * Close WebSocket connection and cleanup
 * Call this from Console.tsx cleanup
 */
export function closeWebSocket(): void {
  console.log("[WebSocket] Closing connection...");

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  wsConnected.value = false;
  currentUrl = null;
  reconnectAttempts = 0;
}

/**
 * Internal connection logic
 */
function connect(): void {
  if (!currentUrl) {
    console.error("[WebSocket] No URL configured");
    return;
  }

  try {
    console.log(`[WebSocket] Connecting to ${currentUrl}...`);
    ws = new WebSocket(currentUrl);

    ws.onopen = () => {
      console.log("[WebSocket] Connected");
      wsConnected.value = true;
      wsError.value = null;
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        // Validate message format
        if (!isConsoleMessage(parsed)) {
          console.error("[WebSocket] Invalid message format:", parsed);
          return;
        }

        const message = parsed;
        console.log("[WebSocket] Message received:", message.type);

        // Handle connection established message with type guard
        if (isConnectionEstablished(message)) {
          const payload = message.payload as { connectionId: ConnectionId };
          wsConnectionId.value = payload.connectionId;
        }

        // Add message to history
        wsMessages.value = [...wsMessages.value, message];
      } catch (error) {
        console.error("[WebSocket] Error parsing message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket] Disconnected: ${event.code} ${event.reason}`);
      wsConnected.value = false;
      ws = null;

      // Attempt reconnection with exponential backoff
      if (!event.wasClean && currentUrl) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`[WebSocket] Reconnecting in ${delay}ms...`);

        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++;
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
      wsError.value = "WebSocket connection error";
    };
  } catch (error) {
    console.error("[WebSocket] Error creating WebSocket:", error);
    wsError.value = "Failed to create WebSocket connection";
  }
}

/**
 * Send command to server
 */
export function sendCommand(command: ConsoleCommand): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      console.log("[WebSocket] Sending command:", command.type);
      ws.send(JSON.stringify(command));
    } catch (error) {
      console.error("[WebSocket] Error sending command:", error);
      wsError.value = "Failed to send command";
    }
  } else {
    console.warn("[WebSocket] Not connected, cannot send command");
    wsError.value = "Not connected to server";
  }
}

/**
 * Clear message history
 */
export function clearMessages(): void {
  wsMessages.value = [];
}

/**
 * Hook to access WebSocket state (optional convenience)
 * Components can access signals directly or use this hook
 */
export function useWebSocket() {
  return {
    connected: wsConnected,
    messages: wsMessages,
    error: wsError,
    connectionId: wsConnectionId,
    sendCommand,
    clearMessages,
  };
}
