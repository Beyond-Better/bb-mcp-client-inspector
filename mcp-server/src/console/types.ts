/**
 * Console Types
 * 
 * Type definitions for console integration, message tracking,
 * and WebSocket communication.
 */

/**
 * MCP protocol message (generic JSON-RPC message)
 */
export interface McpMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * Message entry stored in KV
 */
export interface MessageEntry {
  id: string;
  timestamp: number;
  sessionId: string;
  direction: 'incoming' | 'outgoing';
  message: McpMessage;
}

/**
 * Client information
 */
export interface ClientInfo {
  clientId: string;
  sessionId: string;
  connectedAt: number;
  lastSeen: number;
  transport: 'stdio' | 'http';
  metadata?: Record<string, unknown>;
}

/**
 * Console message sent to UI
 */
export interface ConsoleMessage {
  type: string;
  payload: unknown;
  timestamp?: number;
}

/**
 * Console command from UI
 */
export interface ConsoleCommand {
  type: string;
  payload: unknown;
}

/**
 * Notification trigger payload
 */
export interface NotificationPayload {
  method: string;
  params?: unknown;
}

/**
 * Sampling request payload
 */
export interface SamplingPayload {
  messages: Array<{
    role: 'user' | 'assistant';
    content: {
      type: 'text' | 'image';
      text?: string;
      data?: string;
      mimeType?: string;
    };
  }>;
  modelPreferences?: {
    hints?: Array<{ name?: string }>;
    costPriority?: number;
    speedPriority?: number;
    intelligencePriority?: number;
  };
  systemPrompt?: string;
  includeContext?: 'none' | 'thisServer' | 'allServers';
  temperature?: number;
  maxTokens: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Elicitation request payload
 */
export interface ElicitationPayload {
  message: string;
  requestedSchema?: Record<string, unknown>;
}

/**
 * Message history request payload
 */
export interface MessageHistoryPayload {
  sessionId?: string;
  limit?: number;
}
