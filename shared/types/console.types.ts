/**
 * Console WebSocket Protocol Types
 *
 * Type definitions for WebSocket communication between MCP server and Fresh UI console.
 */

import type { ClientId, ConnectionId, JsonValue, SessionId, Timestamp } from './common.types.ts';
import type { McpMessage } from './mcp.types.ts';

/**
 * Message sent from MCP server to console UI
 */
export interface ConsoleMessage {
  type: ConsoleMessageType;
  payload: unknown;
  timestamp?: Timestamp;
}

/**
 * All console message types
 */
export type ConsoleMessageType =
  | 'connection_established'
  | 'client_list'
  | 'message_history'
  | 'mcp_message'
  | 'tool_call'
  | 'tool_response'
  | 'sampling_response'
  | 'sampling_error'
  | 'elicitation_response'
  | 'elicitation_error'
  | 'notification_sent'
  | 'notification_error'
  | 'error';

/**
 * Command sent from console UI to MCP server
 */
export interface ConsoleCommand {
  type: ConsoleCommandType;
  payload?: unknown;
}

/**
 * All console command types
 */
export type ConsoleCommandType =
  | 'trigger_notification'
  | 'request_sampling'
  | 'request_elicitation'
  | 'get_clients'
  | 'get_message_history';

/**
 * Connection established payload
 */
export interface ConnectionEstablishedPayload {
  connectionId: ConnectionId;
  timestamp: Timestamp;
  serverVersion: string;
}

/**
 * Client list payload
 */
export interface ClientListPayload {
  clients: ClientInfo[];
}

/**
 * Information about a connected MCP client
 */
export interface ClientInfo {
  clientId: ClientId;
  sessionId: SessionId;
  connectedAt: Timestamp;
  lastSeen: Timestamp;
  transport: 'stdio' | 'http';
  metadata?: Record<string, JsonValue>;
}

/**
 * Message history payload
 */
export interface MessageHistoryPayload {
  messages: MessageEntry[];
  sessionId: SessionId;
  hasMore: boolean;
}

/**
 * Stored message entry
 */
export interface MessageEntry {
  id: string;
  timestamp: Timestamp;
  sessionId: SessionId;
  direction: 'incoming' | 'outgoing';
  message: McpMessage;
}

/**
 * Notification trigger payload
 * Matches SendNotificationRequest from bb-mcp-server library
 */
export interface NotificationPayload {
  /**
   * The severity of this log message.
   */
  level: NotificationLevel;
  /**
   * An optional name of the logger issuing this message.
   */
  logger?: string;
  /**
   * The data to be logged, such as a string message or an object.
   */
  data: unknown;
  /**
   * Optional session ID for targeting specific client
   */
  sessionId?: SessionId;
}

/**
 * Notification levels
 */
export type NotificationLevel =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'critical'
  | 'alert'
  | 'emergency';

/**
 * Sampling request payload
 */
export interface SamplingPayload {
  messages: SamplingMessage[];
  modelPreferences?: ModelPreferences;
  systemPrompt?: string;
  includeContext?: 'none' | 'thisServer' | 'allServers';
  temperature?: number;
  maxTokens: number;
  stopSequences?: string[];
  metadata?: Record<string, JsonValue>;
  /**
   * Optional session ID for targeting specific client
   */
  sessionId?: SessionId;
}

/**
 * Sampling message
 */
export interface SamplingMessage {
  role: 'user' | 'assistant';
  content: SamplingContent;
}

/**
 * Sampling content types
 */
export type SamplingContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string };

/**
 * Model preferences for sampling
 */
export interface ModelPreferences {
  hints?: ModelHint[];
  costPriority?: number;
  speedPriority?: number;
  intelligencePriority?: number;
}

/**
 * Model hint
 */
export interface ModelHint {
  name?: string;
}

/**
 * Sampling response payload
 */
export interface SamplingResponsePayload {
  content: SamplingContent;
  model?: string;
  stopReason?: 'endTurn' | 'stopSequence' | 'maxTokens';
}

/**
 * Elicitation request payload
 */
export interface ElicitationPayload {
  message: string;
  requestedSchema?: ElicitationSchema;
  /**
   * Optional session ID for targeting specific client
   */
  sessionId?: SessionId;
}

/**
 * Elicitation schema for structured input
 */
export interface ElicitationSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, ElicitationSchemaProperty>;
  required?: string[];
  description?: string;
}

/**
 * Elicitation schema property
 */
export interface ElicitationSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: unknown[];
  enumNames?: string[];
  items?: ElicitationSchemaProperty;
  properties?: Record<string, ElicitationSchemaProperty>;
}

/**
 * Elicitation response payload
 */
export interface ElicitationResponsePayload {
  action: 'accept' | 'decline' | 'cancel';
  content?: Record<string, unknown>;
}

/**
 * Error payload
 */
export interface ErrorPayload {
  message: string;
  error?: string;
  code?: string;
  details?: unknown;
}

/**
 * Message history request payload
 */
export interface MessageHistoryRequestPayload {
  sessionId?: SessionId;
  limit?: number;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for console messages
 */
export function isConsoleMessage(value: unknown): value is ConsoleMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'payload' in value
  );
}

/**
 * Type guard for connection established message
 */
export function isConnectionEstablished(
  message: ConsoleMessage,
): message is ConsoleMessage & { type: 'connection_established' } {
  return message.type === 'connection_established';
}

/**
 * Type guard for client list message
 */
export function isClientList(
  message: ConsoleMessage,
): message is ConsoleMessage & { type: 'client_list' } {
  return message.type === 'client_list';
}

/**
 * Type guard for message history
 */
export function isMessageHistory(
  message: ConsoleMessage,
): message is ConsoleMessage & { type: 'message_history' } {
  return message.type === 'message_history';
}

/**
 * Type guard for sampling response
 */
export function isSamplingResponse(
  message: ConsoleMessage,
): message is ConsoleMessage & { type: 'sampling_response' } {
  return message.type === 'sampling_response';
}

/**
 * Type guard for sampling error
 */
export function isSamplingError(
  message: ConsoleMessage,
): message is ConsoleMessage & { type: 'sampling_error' } {
  return message.type === 'sampling_error';
}

/**
 * Type guard for elicitation response
 */
export function isElicitationResponse(
  message: ConsoleMessage,
): message is ConsoleMessage & { type: 'elicitation_response' } {
  return message.type === 'elicitation_response';
}

/**
 * Type guard for elicitation error
 */
export function isElicitationError(
  message: ConsoleMessage,
): message is ConsoleMessage & { type: 'elicitation_error' } {
  return message.type === 'elicitation_error';
}

/**
 * Type guard for notification sent
 */
export function isNotificationSent(
  message: ConsoleMessage,
): message is ConsoleMessage & { type: 'notification_sent' } {
  return message.type === 'notification_sent';
}

/**
 * Type guard for error message
 */
export function isErrorMessage(
  message: ConsoleMessage,
): message is ConsoleMessage & { type: 'error' } {
  return message.type === 'error';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create typed console message
 */
export function createConsoleMessage<T extends ConsoleMessageType>(
  type: T,
  payload: unknown,
  timestamp?: Timestamp,
): ConsoleMessage {
  return {
    type,
    payload,
    timestamp: timestamp ?? Date.now(),
  };
}

/**
 * Create typed console command
 */
export function createConsoleCommand<T extends ConsoleCommandType>(
  type: T,
  payload?: unknown,
): ConsoleCommand {
  return {
    type,
    payload,
  };
}
