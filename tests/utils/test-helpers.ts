/**
 * Test Helpers
 *
 * Utility functions for testing across the project.
 */

import { Logger } from '@beyondbetter/bb-mcp-server';
import type { ClientInfo, MessageEntry } from '@shared/types/index.ts';
import type { ClientId, SessionId } from '@shared/types/index.ts';

/**
 * Create in-memory Deno KV for testing
 */
export async function createTestKV(): Promise<Deno.Kv> {
  // Use :memory: path for in-memory KV
  return await Deno.openKv(':memory:');
}

/**
 * Create test logger with configurable output
 */
export function createTestLogger(_options?: Record<PropertyKey, never>): Logger {
  //const silent = options?.silent ?? true;
  //const level = options?.level ?? 'error';

  // Create logger without invalid config
  const logger = new Logger();
  return logger;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options?: {
    timeout?: number;
    interval?: number;
    message?: string;
  },
): Promise<void> {
  const timeout = options?.timeout ?? 5000;
  const interval = options?.interval ?? 100;
  const message = options?.message ?? 'Condition not met';

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`${message} (timeout after ${timeout}ms)`);
}

/**
 * Create sample client info for testing
 */
export function createSampleClientInfo(
  overrides?: Partial<ClientInfo>,
): ClientInfo {
  return {
    clientId: 'test-client-1' as ClientId,
    sessionId: 'test-session-1' as SessionId,
    connectedAt: Date.now(),
    lastSeen: Date.now(),
    transport: 'http',
    metadata: {
      clientInfo: {
        name: 'Test Client',
        version: '1.0.0',
      },
    },
    ...overrides,
  };
}

/**
 * Create sample message entry for testing
 */
export function createSampleMessageEntry(
  overrides?: Partial<MessageEntry>,
): MessageEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    sessionId: 'test-session-1' as SessionId,
    direction: 'incoming',
    message: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'echo',
        arguments: { message: 'test' },
      },
    },
    ...overrides,
  };
}

/**
 * Delay execution for testing
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that a promise rejects with expected error
 */
export async function assertRejects(
  fn: () => Promise<unknown>,
  errorCheck?: (error: Error) => boolean,
): Promise<void> {
  let didThrow = false;
  let thrownError: Error | null = null;

  try {
    await fn();
  } catch (error) {
    didThrow = true;
    thrownError = error instanceof Error ? error : new Error(String(error));
  }

  if (!didThrow) {
    throw new Error('Expected promise to reject, but it resolved');
  }

  if (errorCheck && thrownError && !errorCheck(thrownError)) {
    throw new Error(
      `Promise rejected with unexpected error: ${thrownError.message}`,
    );
  }
}

/**
 * Create a mock WebSocket for testing
 */
export class MockWebSocket {
  readyState: number = WebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  private sentMessages: string[] = [];

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: string): void {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(
        new CloseEvent('close', { code: 1000, reason: 'Normal closure' }),
      );
    }
  }

  // Test helpers
  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  getSentMessages(): string[] {
    return [...this.sentMessages];
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}

/**
 * Spy on function calls
 */
export class FunctionSpy<T extends (...args: any[]) => any> {
  calls: Array<{ args: Parameters<T>; result?: ReturnType<T>; error?: Error }> = [];
  private originalFn: T;

  constructor(originalFn: T) {
    this.originalFn = originalFn;
  }

  get fn(): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = this.originalFn(...args);
        this.calls.push({ args, result });
        return result;
      } catch (error) {
        this.calls.push({ args, error: error as Error });
        throw error;
      }
    }) as T;
  }

  get callCount(): number {
    return this.calls.length;
  }

  reset(): void {
    this.calls = [];
  }
}
