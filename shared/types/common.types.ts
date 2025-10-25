/**
 * Common Utility Types
 *
 * Shared utility types and helpers used across the project.
 */

/**
 * Generic result type for error handling
 *
 * @example
 * ```ts
 * function divide(a: number, b: number): Result<number> {
 *   if (b === 0) {
 *     return { success: false, error: new Error("Division by zero") };
 *   }
 *   return { success: true, data: a / b };
 * }
 *
 * const result = divide(10, 2);
 * if (result.success) {
 *   console.log(result.data); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Make specific properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredFields<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Timestamp in milliseconds since epoch
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
 *
 * Creates a nominal type that prevents accidental mixing of different ID types.
 *
 * @example
 * ```ts
 * type UserId = Brand<string, "UserId">;
 * type SessionId = Brand<string, "SessionId">;
 *
 * function getUser(id: UserId) { ... }
 *
 * const userId: UserId = "user-123" as UserId;
 * const sessionId: SessionId = "session-456" as SessionId;
 *
 * getUser(userId); // OK
 * getUser(sessionId); // Type error!
 * ```
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Session ID (branded string)
 */
export type SessionId = Brand<string, 'SessionId'>;

/**
 * Client ID (branded string)
 */
export type ClientId = Brand<string, 'ClientId'>;

/**
 * Connection ID (branded string)
 */
export type ConnectionId = Brand<string, 'ConnectionId'>;

/**
 * Message ID (branded string)
 */
export type MessageId = Brand<string, 'MessageId'>;

/**
 * Transport type enumeration
 */
export enum TransportType {
  STDIO = 'stdio',
  HTTP = 'http',
}

/**
 * Message direction enumeration
 */
export enum MessageDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

/**
 * Connection status enumeration
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Helper to convert unknown error to Error type
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

/**
 * Helper to get error message from unknown error
 */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
