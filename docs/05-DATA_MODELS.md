# Data Models - Type Definitions and Interfaces

## Overview

This document defines all TypeScript interfaces and types used across the MCP Server Client Inspector project. These types are shared between the MCP server and Fresh UI components.

## Shared Types Location

```
shared/
└── types/
    ├── console.types.ts      # Console WebSocket protocol types
    ├── mcp.types.ts          # MCP protocol types
    └── common.types.ts       # Common utility types
```

## Console WebSocket Protocol Types

```typescript
// shared/types/console.types.ts

/**
 * Message sent from MCP server to console UI
 */
export interface ConsoleMessage {
  type: ConsoleMessageType;
  payload: unknown;
  timestamp?: number;
}

export type ConsoleMessageType =
  | "connection_established"
  | "client_list"
  | "message_history"
  | "mcp_message"
  | "tool_call"
  | "tool_response"
  | "sampling_response"
  | "sampling_error"
  | "elicitation_response"
  | "elicitation_error"
  | "notification_sent"
  | "error";

/**
 * Command sent from console UI to MCP server
 */
export interface ConsoleCommand {
  type: ConsoleCommandType;
  payload?: unknown;
}

export type ConsoleCommandType =
  | "trigger_notification"
  | "request_sampling"
  | "request_elicitation"
  | "get_clients"
  | "get_message_history";

/**
 * Connection established payload
 */
export interface ConnectionEstablishedPayload {
  connectionId: string;
  timestamp: number;
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
  id: string;
  name: string;
  version?: string;
  transport: "stdio" | "http";
  connected: boolean;
  lastSeen: number;
  sessionId?: string;
}

/**
 * Message history payload
 */
export interface MessageHistoryPayload {
  messages: MessageEntry[];
  sessionId: string;
  hasMore: boolean;
}

/**
 * Stored message entry
 */
export interface MessageEntry {
  id: string;
  timestamp: number;
  sessionId: string;
  direction: "incoming" | "outgoing";
  message: McpMessage;
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
  messages: SamplingMessage[];
  modelPreferences?: ModelPreferences;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}

export interface SamplingMessage {
  role: "user" | "assistant";
  content: SamplingContent;
}

export type SamplingContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };

export interface ModelPreferences {
  hints?: ModelHint[];
  costPriority?: number;
  speedPriority?: number;
  intelligencePriority?: number;
}

export interface ModelHint {
  name?: string;
}

/**
 * Sampling response payload
 */
export interface SamplingResponsePayload {
  content: SamplingContent;
  model?: string;
  stopReason?: "endTurn" | "stopSequence" | "maxTokens";
}

/**
 * Elicitation request payload
 */
export interface ElicitationPayload {
  message: string;
  requestedSchema?: ElicitationSchema;
}

export interface ElicitationSchema {
  type: "object" | "string" | "number" | "boolean" | "array";
  properties?: Record<string, ElicitationSchemaProperty>;
  required?: string[];
  description?: string;
}

export interface ElicitationSchemaProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
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
  action: "accept" | "decline" | "cancel";
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
```

## MCP Protocol Types

```typescript
// shared/types/mcp.types.ts

/**
 * MCP JSON-RPC message
 */
export interface McpMessage {
  jsonrpc: "2.0";
  id?: string | number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: McpError;
}

/**
 * MCP error object
 */
export interface McpError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * MCP error codes
 */
export enum McpErrorCode {
  // JSON-RPC standard errors
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,

  // MCP-specific errors
  ResourceNotFound = -32001,
  ResourceAccessDenied = -32002,
  ToolNotFound = -32003,
  ToolExecutionError = -32004,
}

/**
 * Initialize request
 */
export interface InitializeRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: "initialize";
  params: InitializeParams;
}

export interface InitializeParams {
  protocolVersion: string;
  capabilities: ClientCapabilities;
  clientInfo: ClientInfo;
}

export interface ClientCapabilities {
  sampling?: Record<string, unknown>;
  elicitation?: Record<string, unknown>;
  roots?: {
    listChanged?: boolean;
  };
}

/**
 * Initialize response
 */
export interface InitializeResponse {
  jsonrpc: "2.0";
  id: string | number;
  result: InitializeResult;
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: ServerCapabilities;
  serverInfo: ServerInfo;
}

export interface ServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: Record<string, unknown>;
}

export interface ServerInfo {
  name: string;
  version: string;
}

/**
 * Tool call request
 */
export interface ToolCallRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: "tools/call";
  params: ToolCallParams;
}

export interface ToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

/**
 * Tool call response
 */
export interface ToolCallResponse {
  jsonrpc: "2.0";
  id: string | number;
  result: ToolCallResult;
}

export interface ToolCallResult {
  content: ToolContent[];
  isError?: boolean;
}

export type ToolContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string }
  | { type: "resource"; resource: ResourceContent };

export interface ResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

/**
 * List tools request
 */
export interface ListToolsRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: "tools/list";
  params?: Record<string, never>;
}

/**
 * List tools response
 */
export interface ListToolsResponse {
  jsonrpc: "2.0";
  id: string | number;
  result: ListToolsResult;
}

export interface ListToolsResult {
  tools: ToolInfo[];
}

export interface ToolInfo {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Notification message
 */
export interface NotificationMessage {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}

/**
 * Sampling notification (from server to client)
 */
export interface SamplingNotification {
  jsonrpc: "2.0";
  method: "sampling/createMessage";
  params: SamplingParams;
}

export interface SamplingParams {
  messages: Array<{
    role: "user" | "assistant";
    content: {
      type: "text" | "image";
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
  includeContext?: "none" | "thisServer" | "allServers";
  temperature?: number;
  maxTokens: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Elicitation request (from server to client)
 */
export interface ElicitationRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: "elicitation/request";
  params: ElicitationParams;
}

export interface ElicitationParams {
  message: string;
  requestedSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Elicitation response (from client to server)
 */
export interface ElicitationResponse {
  jsonrpc: "2.0";
  id: string | number;
  result: {
    action: "accept" | "decline" | "cancel";
    content?: Record<string, unknown>;
  };
}

/**
 * Tools list changed notification
 */
export interface ToolsListChangedNotification {
  jsonrpc: "2.0";
  method: "notifications/tools/list_changed";
  params?: Record<string, never>;
}

/**
 * Resources list changed notification
 */
export interface ResourcesListChangedNotification {
  jsonrpc: "2.0";
  method: "notifications/resources/list_changed";
  params?: Record<string, never>;
}

/**
 * Prompts list changed notification
 */
export interface PromptsListChangedNotification {
  jsonrpc: "2.0";
  method: "notifications/prompts/list_changed";
  params?: Record<string, never>;
}
```

## Common Utility Types

```typescript
// shared/types/common.types.ts

/**
 * Generic result type
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Optional fields helper
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required fields helper
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Deep partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Timestamp (milliseconds since epoch)
 */
export type Timestamp = number;

/**
 * UUID string
 */
export type UUID = string;

/**
 * JSON-serializable value
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Branded type helper for type safety
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Session ID
 */
export type SessionId = Brand<string, "SessionId">;

/**
 * Client ID
 */
export type ClientId = Brand<string, "ClientId">;

/**
 * Connection ID
 */
export type ConnectionId = Brand<string, "ConnectionId">;
```

## Storage Schema (Deno KV)

### Key Structure

```typescript
/**
 * Deno KV key patterns
 */
export type KVKey =
  // Messages
  | ["messages", SessionId, string, UUID]  // timestamp as string for ordering
  
  // Clients
  | ["clients", ClientId]
  
  // Sessions
  | ["sessions", SessionId]
  
  // Metadata
  | ["metadata", "server_info"]
  | ["metadata", "stats"];
```

### Stored Values

```typescript
/**
 * Message storage value
 */
export interface StoredMessage {
  id: UUID;
  timestamp: Timestamp;
  sessionId: SessionId;
  clientId?: ClientId;
  direction: "incoming" | "outgoing";
  message: McpMessage;
  metadata?: Record<string, JsonValue>;
}

/**
 * Client storage value
 */
export interface StoredClient {
  id: ClientId;
  name: string;
  version?: string;
  transport: "stdio" | "http";
  connected: boolean;
  connectedAt: Timestamp;
  lastSeen: Timestamp;
  sessionId?: SessionId;
  metadata?: Record<string, JsonValue>;
}

/**
 * Session storage value
 */
export interface StoredSession {
  id: SessionId;
  clientId: ClientId;
  startedAt: Timestamp;
  lastActivity: Timestamp;
  messageCount: number;
  metadata?: Record<string, JsonValue>;
}

/**
 * Server info storage value
 */
export interface StoredServerInfo {
  version: string;
  startedAt: Timestamp;
  uptime: number;
}

/**
 * Statistics storage value
 */
export interface StoredStats {
  totalMessages: number;
  totalClients: number;
  totalSessions: number;
  lastUpdated: Timestamp;
}
```

## UI State Types

```typescript
// For Fresh UI islands

/**
 * WebSocket connection state
 */
export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connectionId: ConnectionId | null;
  reconnectAttempts: number;
}

/**
 * Message viewer state
 */
export interface MessageViewerState {
  messages: ConsoleMessage[];
  filteredMessages: ConsoleMessage[];
  selectedMessageId: string | null;
  filter: MessageFilter;
  autoScroll: boolean;
}

export type MessageFilter =
  | "all"
  | "mcp"
  | "sampling"
  | "elicitation"
  | "notifications"
  | "errors";

/**
 * Client selector state
 */
export interface ClientSelectorState {
  clients: ClientInfo[];
  selectedClientId: ClientId | null;
  loading: boolean;
}

/**
 * Form state
 */
export interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  submitting: boolean;
}
```

## Validation Schemas

```typescript
// For runtime validation (using Zod)

import { z } from "zod";

/**
 * Console command schema
 */
export const consoleCommandSchema = z.object({
  type: z.enum([
    "trigger_notification",
    "request_sampling",
    "request_elicitation",
    "get_clients",
    "get_message_history",
  ]),
  payload: z.unknown().optional(),
});

/**
 * Notification payload schema
 */
export const notificationPayloadSchema = z.object({
  method: z.string(),
  params: z.unknown().optional(),
});

/**
 * Sampling payload schema
 */
export const samplingPayloadSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.object({
        type: z.enum(["text", "image"]),
        text: z.string().optional(),
        data: z.string().optional(),
        mimeType: z.string().optional(),
      }),
    })
  ),
  modelPreferences: z
    .object({
      hints: z
        .array(
          z.object({
            name: z.string().optional(),
          })
        )
        .optional(),
      costPriority: z.number().min(0).max(1).optional(),
      speedPriority: z.number().min(0).max(1).optional(),
      intelligencePriority: z.number().min(0).max(1).optional(),
    })
    .optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  stopSequences: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Elicitation payload schema
 */
export const elicitationPayloadSchema = z.object({
  message: z.string().min(1),
  requestedSchema: z
    .object({
      type: z.enum(["object", "string", "number", "boolean", "array"]),
      properties: z.record(z.unknown()).optional(),
      required: z.array(z.string()).optional(),
      description: z.string().optional(),
    })
    .optional(),
});

/**
 * Client info schema
 */
export const clientInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string().optional(),
  transport: z.enum(["stdio", "http"]),
  connected: z.boolean(),
  lastSeen: z.number(),
  sessionId: z.string().optional(),
});
```

## Type Guards

```typescript
/**
 * Type guard for console messages
 */
export function isConsoleMessage(value: unknown): value is ConsoleMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "payload" in value
  );
}

/**
 * Type guard for MCP messages
 */
export function isMcpMessage(value: unknown): value is McpMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "jsonrpc" in value &&
    (value as McpMessage).jsonrpc === "2.0"
  );
}

/**
 * Type guard for MCP errors
 */
export function isMcpError(value: unknown): value is McpError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value
  );
}

/**
 * Type guard for notification messages
 */
export function isNotificationMessage(
  message: McpMessage
): message is NotificationMessage {
  return "method" in message && !"id" in message;
}

/**
 * Type guard for request messages
 */
export function isRequestMessage(message: McpMessage): boolean {
  return "method" in message && "id" in message;
}

/**
 * Type guard for response messages
 */
export function isResponseMessage(message: McpMessage): boolean {
  return "id" in message && ("result" in message || "error" in message);
}
```

## Enum Definitions

```typescript
/**
 * MCP protocol version
 */
export enum McpProtocolVersion {
  V1_0_0 = "1.0.0",
}

/**
 * Transport type
 */
export enum TransportType {
  STDIO = "stdio",
  HTTP = "http",
}

/**
 * Message direction
 */
export enum MessageDirection {
  INCOMING = "incoming",
  OUTGOING = "outgoing",
}

/**
 * Connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

/**
 * Notification methods
 */
export enum NotificationMethod {
  TOOLS_LIST_CHANGED = "notifications/tools/list_changed",
  RESOURCES_LIST_CHANGED = "notifications/resources/list_changed",
  PROMPTS_LIST_CHANGED = "notifications/prompts/list_changed",
}
```

## Constants

```typescript
/**
 * Protocol constants
 */
export const MCP_PROTOCOL_VERSION = "1.0.0";
export const JSONRPC_VERSION = "2.0";

/**
 * Timeout constants (milliseconds)
 */
export const DEFAULT_TIMEOUT = 30000;
export const TOOL_CALL_TIMEOUT = 60000;
export const SAMPLING_TIMEOUT = 120000;
export const ELICITATION_TIMEOUT = 300000;

/**
 * Message limits
 */
export const MAX_MESSAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_MESSAGES_PER_SESSION = 1000;
export const MESSAGE_RETENTION_DAYS = 7;

/**
 * WebSocket constants
 */
export const WS_HEARTBEAT_INTERVAL = 30000;
export const WS_RECONNECT_DELAY_BASE = 1000;
export const WS_MAX_RECONNECT_ATTEMPTS = 10;

/**
 * UI constants
 */
export const MESSAGE_VIEWER_PAGE_SIZE = 50;
export const AUTO_SCROLL_THRESHOLD = 100;
```

## Type Utilities

```typescript
/**
 * Extract payload type from console message
 */
export type ExtractPayload<T extends ConsoleMessageType> =
  T extends "connection_established"
    ? ConnectionEstablishedPayload
    : T extends "client_list"
    ? ClientListPayload
    : T extends "message_history"
    ? MessageHistoryPayload
    : T extends "sampling_response"
    ? SamplingResponsePayload
    : T extends "elicitation_response"
    ? ElicitationResponsePayload
    : T extends "error"
    ? ErrorPayload
    : unknown;

/**
 * Create typed console message
 */
export function createConsoleMessage<T extends ConsoleMessageType>(
  type: T,
  payload: ExtractPayload<T>
): ConsoleMessage {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}

/**
 * Create typed console command
 */
export function createConsoleCommand<T extends ConsoleCommandType>(
  type: T,
  payload?: unknown
): ConsoleCommand {
  return {
    type,
    payload,
  };
}
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Status**: Design Complete - Ready for Implementation