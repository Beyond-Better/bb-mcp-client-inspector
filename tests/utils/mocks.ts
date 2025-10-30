/**
 * Mock Classes and Utilities
 *
 * Mock implementations for testing MCP server and console components.
 */

import type { BeyondMcpServer, Logger, ToolDependencies } from '@beyondbetter/bb-mcp-server';
import type { ClientInfo, MessageEntry } from '@shared/types/index.ts';
import type { ClientId, SessionId } from '@shared/types/index.ts';

/**
 * Mock BeyondMcpServer for testing
 */
export class MockBeyondMcpServer implements Partial<BeyondMcpServer> {
  private notifications: Array<
    {
      level: string;
      logger?: string;
      data: unknown;
      options: { sessionId?: string; meta?: Record<string, unknown> };
    }
  > = [];
  private samplingRequests: Array<
    { messages: unknown[]; options: { sessionId?: string; meta?: Record<string, unknown> } }
  > = [];
  private elicitationRequests: Array<
    { message: string; options: { sessionId?: string; meta?: Record<string, unknown> } }
  > = [];

  // deno-lint-ignore require-await
  async sendNotification(
    params: { level: string; logger?: string; data: unknown },
    options: { sessionId?: string; meta?: Record<string, unknown> },
  ): Promise<void> {
    this.notifications.push({ ...params, options });
  }

  // deno-lint-ignore require-await
  async createMessage(
    request: { model?: string; messages: unknown[]; maxTokens?: number },
    options: { sessionId?: string; meta?: Record<string, unknown> },
  ): Promise<
    {
      content: { type: 'text'; text: string }[];
      model: string;
      stopReason: string;
    }
  > {
    this.samplingRequests.push({ messages: request.messages, options });
    return {
      content: [{ type: 'text', text: 'Mock response' }],
      model: request.model || 'mock-model',
      stopReason: 'endTurn',
    };
  }

  // deno-lint-ignore require-await
  async elicitInput(
    request: { message: string; requestedSchema?: unknown },
    options: { sessionId?: string; meta?: Record<string, unknown> },
  ): Promise<{ action: 'accept' | 'reject'; content?: unknown }> {
    this.elicitationRequests.push({ message: request.message, options });
    return {
      action: 'accept' as const,
      content: { confirmed: true },
    };
  }

  getTransportManager(): any {
    return new MockTransportManager();
  }

  // Test helpers
  getNotifications() {
    return [...this.notifications];
  }

  getSamplingRequests() {
    return [...this.samplingRequests];
  }

  getElicitationRequests() {
    return [...this.elicitationRequests];
  }

  reset() {
    this.notifications = [];
    this.samplingRequests = [];
    this.elicitationRequests = [];
  }
}

/**
 * Mock TransportManager for testing
 */
export class MockTransportManager {
  private clientSessions: Array<{
    sessionId: string;
    connectedAt: number;
    lastActivity: number;
    transport: 'stdio' | 'http';
    clientInfo?: unknown;
    protocolVersion?: string;
    requestCount: number;
    lastMeta?: unknown;
  }> = [];

  getClientSessions() {
    return [...this.clientSessions];
  }

  addClientSession(
    session: {
      sessionId: string;
      transport: 'stdio' | 'http';
      clientInfo?: unknown;
    },
  ) {
    this.clientSessions.push({
      sessionId: session.sessionId,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      transport: session.transport,
      clientInfo: session.clientInfo,
      protocolVersion: '2024-11-05',
      requestCount: 0,
      lastMeta: {},
    });
  }

  reset() {
    this.clientSessions = [];
  }
}

/**
 * Mock MessageTracker for testing
 */
export class MockMessageTracker {
  // Add missing properties to match MessageTracker interface
  private kv: any = null;
  private logger: any = null;
  private messageLimit: number = 1000;
  private retentionDays: number = 7;
  private cleanupOldMessages = async () => {};
  private messages: Map<SessionId, MessageEntry[]> = new Map();
  private clients: Map<ClientId, ClientInfo> = new Map();

  // deno-lint-ignore require-await
  async trackMessage(
    sessionId: SessionId,
    direction: 'incoming' | 'outgoing',
    message: unknown,
  ): Promise<void> {
    const entry: MessageEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      sessionId,
      direction,
      message: message as any,
    };

    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(entry);
    this.messages.set(sessionId, sessionMessages);
  }

  // deno-lint-ignore require-await
  async getMessages(
    sessionId: SessionId,
    limit?: number,
  ): Promise<MessageEntry[]> {
    const messages = this.messages.get(sessionId) || [];
    return limit ? messages.slice(0, limit) : messages;
  }

  // deno-lint-ignore require-await
  async trackClient(clientId: ClientId, info: ClientInfo): Promise<void> {
    this.clients.set(clientId, info);
  }

  // deno-lint-ignore require-await
  async getClients(): Promise<ClientInfo[]> {
    return Array.from(this.clients.values());
  }

  // deno-lint-ignore require-await
  async removeClient(clientId: ClientId): Promise<void> {
    this.clients.delete(clientId);
  }

  // deno-lint-ignore require-await
  async clearSession(sessionId: SessionId): Promise<void> {
    this.messages.delete(sessionId);
  }

  // deno-lint-ignore require-await
  async getStatistics(): Promise<{
    totalMessages: number;
    totalClients: number;
    sessionsWithMessages: number;
  }> {
    let totalMessages = 0;
    for (const messages of this.messages.values()) {
      totalMessages += messages.length;
    }

    return {
      totalMessages,
      totalClients: this.clients.size,
      sessionsWithMessages: this.messages.size,
    };
  }

  // Test helper
  reset() {
    this.messages.clear();
    this.clients.clear();
  }
}

/**
 * Mock Logger for testing
 */
export class MockLogger implements Partial<Logger> {
  logs: Array<{ level: string; message: string; data?: unknown }> = [];

  debug(message: string, data?: unknown): void {
    this.logs.push({ level: 'debug', message, data });
  }

  info(message: string, data?: unknown): void {
    this.logs.push({ level: 'info', message, data });
  }

  warn(message: string, data?: unknown): void {
    this.logs.push({ level: 'warn', message, data });
  }

  error(message: string, data?: unknown): void {
    this.logs.push({ level: 'error', message, data });
  }

  getLogs(): Array<{ level: string; message: string; data?: unknown }> {
    return [...this.logs];
  }

  reset(): void {
    this.logs = [];
  }
}

/**
 * Create mock tool dependencies for testing
 */
export function createMockToolDependencies(
  overrides?: Partial<ToolDependencies>,
): ToolDependencies {
  const mockLogger = new MockLogger();

  return {
    logger: mockLogger as unknown as Logger,
    ...overrides,
  } as ToolDependencies;
}

/**
 * Mock WebSocket Server for testing
 */
export class MockWebSocketServer {
  private connections: Map<string, MockServerWebSocket> = new Map();
  private messageHandlers: Array<(connectionId: string, data: string) => void> = [];

  createConnection(connectionId: string): MockServerWebSocket {
    const socket = new MockServerWebSocket(connectionId, (data) => {
      this.messageHandlers.forEach((handler) => handler(connectionId, data));
    });
    this.connections.set(connectionId, socket);
    return socket;
  }

  onMessage(handler: (connectionId: string, data: string) => void): void {
    this.messageHandlers.push(handler);
  }

  broadcast(data: string): void {
    for (const socket of this.connections.values()) {
      socket.receive(data);
    }
  }

  getConnection(connectionId: string): MockServerWebSocket | undefined {
    return this.connections.get(connectionId);
  }

  closeConnection(connectionId: string): void {
    const socket = this.connections.get(connectionId);
    if (socket) {
      socket.close();
      this.connections.delete(connectionId);
    }
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  reset(): void {
    for (const socket of this.connections.values()) {
      socket.close();
    }
    this.connections.clear();
    this.messageHandlers = [];
  }
}

/**
 * Mock Server-side WebSocket
 */
export class MockServerWebSocket {
  readyState: number = WebSocket.OPEN;
  private sentMessages: string[] = [];
  private onMessageCallback: (data: string) => void;

  constructor(
    public connectionId: string,
    onMessageCallback: (data: string) => void,
  ) {
    this.onMessageCallback = onMessageCallback;
  }

  send(data: string): void {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
  }

  // Simulate receiving a message from client
  receive(data: string): void {
    if (this.readyState === WebSocket.OPEN) {
      this.onMessageCallback(data);
    }
  }

  getSentMessages(): string[] {
    return [...this.sentMessages];
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}
