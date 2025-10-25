/**
 * MCP Protocol Types
 *
 * Type definitions for MCP (Model Context Protocol) JSON-RPC messages.
 */

/**
 * MCP JSON-RPC message (base type)
 */
export interface McpMessage {
  jsonrpc: '2.0';
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
 * MCP error codes (JSON-RPC + MCP-specific)
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
 * MCP protocol constants
 */
export const MCP_PROTOCOL_VERSION = '1.0.0';
export const JSONRPC_VERSION = '2.0';

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for MCP messages
 */
export function isMcpMessage(value: unknown): value is McpMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'jsonrpc' in value &&
    (value as McpMessage).jsonrpc === '2.0'
  );
}

/**
 * Type guard for MCP errors
 */
export function isMcpError(value: unknown): value is McpError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as McpError).code === 'number' &&
    typeof (value as McpError).message === 'string'
  );
}

/**
 * Type guard for notification messages (no id)
 */
export function isNotificationMessage(
  message: McpMessage,
): message is McpMessage & { method: string } {
  return 'method' in message && !('id' in message) &&
    message.method !== undefined;
}

/**
 * Type guard for request messages (has id and method)
 */
export function isRequestMessage(
  message: McpMessage,
): message is McpMessage & { id: string | number; method: string } {
  return (
    'method' in message &&
    'id' in message &&
    message.method !== undefined &&
    message.id !== undefined
  );
}

/**
 * Type guard for response messages (has id and result or error)
 */
export function isResponseMessage(
  message: McpMessage,
): message is McpMessage & { id: string | number } {
  return (
    'id' in message &&
    message.id !== undefined &&
    ('result' in message || 'error' in message)
  );
}

/**
 * Type guard for error response
 */
export function isErrorResponse(
  message: McpMessage,
): message is McpMessage & { id: string | number; error: McpError } {
  return (
    'id' in message &&
    'error' in message &&
    message.id !== undefined &&
    message.error !== undefined
  );
}

/**
 * Type guard for success response
 */
export function isSuccessResponse(
  message: McpMessage,
): message is McpMessage & { id: string | number; result: unknown } {
  return (
    'id' in message &&
    'result' in message &&
    message.id !== undefined &&
    message.result !== undefined
  );
}
