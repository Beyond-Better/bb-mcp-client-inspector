# Testing Strategy - Comprehensive Test Plan

## Overview

This document outlines the testing strategy for the MCP Server Client Inspector
project. It covers unit tests, integration tests, end-to-end tests, and testing
utilities for both the MCP server and Fresh UI components.

## Testing Principles

1. **Test Coverage**: Aim for >80% code coverage
2. **Test Isolation**: Tests should be independent and repeatable
3. **Fast Feedback**: Unit tests should run quickly (<5 seconds total)
4. **Realistic Scenarios**: Integration tests should mimic real usage
5. **Comprehensive**: Cover happy paths, edge cases, and error conditions

## Testing Stack

### MCP Server Testing

**Framework**: Deno's built-in test runner

```bash
deno test --allow-all --unstable-kv tests/
```

**Utilities**:

- `@std/testing/asserts` - Assertions
- `@std/testing/bdd` - BDD-style tests
- `@std/testing/mock` - Mocking and spying
- `@std/testing/snapshot` - Snapshot testing

### Fresh UI Testing

**Framework**: Deno test with Preact testing utilities

```bash
cd fresh-ui
deno test --allow-all tests/
```

**Utilities**:

- `@preact/testing-library` - Component testing
- Fresh test utilities

## Test Structure

### MCP Server Tests

```
mcp-server/tests/
├── unit/
│   ├── tools/
│   │   ├── echo.test.ts
│   │   ├── convertDate.test.ts
│   │   ├── calculate.test.ts
│   │   ├── delayResponse.test.ts
│   │   ├── randomData.test.ts
│   │   └── triggerError.test.ts
│   ├── console/
│   │   ├── ConsoleManager.test.ts
│   │   └── MessageTracker.test.ts
│   └── plugin/
│       └── InspectorPlugin.test.ts
├── integration/
│   ├── websocket/
│   │   ├── connection.test.ts
│   │   ├── messaging.test.ts
│   │   └── commands.test.ts
│   ├── mcp/
│   │   ├── toolCalls.test.ts
│   │   ├── sampling.test.ts
│   │   ├── elicitation.test.ts
│   │   └── notifications.test.ts
│   └── storage/
│       └── messageHistory.test.ts
├── e2e/
│   └── fullFlow.test.ts
└── utils/
    ├── testHelpers.ts
    ├── mockClients.ts
    └── fixtures.ts
```

### Fresh UI Tests

```
fresh-ui/tests/
├── hooks/
│   └── useWebSocket.test.ts
├── islands/
│   ├── ConnectionStatus.test.ts
│   ├── ClientSelector.test.ts
│   ├── SamplingForm.test.ts
│   ├── ElicitationForm.test.ts
│   ├── NotificationTrigger.test.ts
│   └── MessageViewer.test.ts
└── utils/
    └── testHelpers.ts
```

## Unit Tests

### Tool Tests

#### Echo Tool Test

```typescript
// tests/unit/tools/echo.test.ts

import { assertEquals } from '@std/testing/asserts';
import { describe, it } from '@std/testing/bdd';
import { echoTool } from '../../../src/plugins/inspector.plugin/tools/echo.ts';

describe('Echo Tool', () => {
  it('should echo back the message', async () => {
    const result = await echoTool.handler({
      message: 'Hello, World!',
    });

    assertEquals(result.content[0].type, 'text');
    assertEquals(result.content[0].text, 'Hello, World!');
  });

  it('should apply delay if specified', async () => {
    const startTime = Date.now();

    await echoTool.handler({
      message: 'test',
      delay: 100,
    });

    const duration = Date.now() - startTime;
    assertEquals(duration >= 100, true);
  });

  it('should convert to uppercase if requested', async () => {
    const result = await echoTool.handler({
      message: 'hello',
      uppercase: true,
    });

    assertEquals(result.content[0].text, 'HELLO');
  });

  it('should handle empty message', async () => {
    const result = await echoTool.handler({
      message: '',
    });

    assertEquals(result.content[0].text, '');
  });
});
```

#### Calculate Tool Test

```typescript
// tests/unit/tools/calculate.test.ts

import { assertEquals } from '@std/testing/asserts';
import { describe, it } from '@std/testing/bdd';
import { calculateTool } from '../../../src/plugins/inspector.plugin/tools/calculate.ts';

describe('Calculate Tool', () => {
  it('should add two numbers', async () => {
    const result = await calculateTool.handler({
      operation: 'add',
      a: 5,
      b: 3,
    });

    const data = JSON.parse(result.content[0].text);
    assertEquals(data.result, 8);
  });

  it('should handle division by zero', async () => {
    const result = await calculateTool.handler({
      operation: 'divide',
      a: 10,
      b: 0,
    });

    assertEquals(result.isError, true);
    assertEquals(result.content[0].text.includes('Division by zero'), true);
  });

  it('should calculate power', async () => {
    const result = await calculateTool.handler({
      operation: 'power',
      a: 2,
      b: 3,
    });

    const data = JSON.parse(result.content[0].text);
    assertEquals(data.result, 8);
  });
});
```

### Console Manager Tests

```typescript
// tests/unit/console/ConsoleManager.test.ts

import { assertEquals, assertExists } from '@std/testing/asserts';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { spy } from '@std/testing/mock';
import { ConsoleManager } from '../../../src/console/ConsoleManager.ts';
import { MockBeyondMcpServer, MockLogger, MockMessageTracker } from '../../utils/mockClients.ts';

describe('ConsoleManager', () => {
  let manager: ConsoleManager;
  let mockServer: MockBeyondMcpServer;
  let mockTracker: MockMessageTracker;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockServer = new MockBeyondMcpServer();
    mockTracker = new MockMessageTracker();
    mockLogger = new MockLogger();
    manager = new ConsoleManager(mockServer, mockTracker, mockLogger);
  });

  it('should handle WebSocket connections', () => {
    const request = new Request('http://localhost/ws/console', {
      headers: {
        'upgrade': 'websocket',
      },
    });

    const response = manager.handleWebSocket(request);
    assertExists(response);
    assertEquals(response.status, 101);
  });

  it('should broadcast messages to all connected clients', () => {
    // Create mock WebSocket connections
    const ws1 = createMockWebSocket();
    const ws2 = createMockWebSocket();

    manager['wsConnections'].set('client1', ws1);
    manager['wsConnections'].set('client2', ws2);

    const sendSpy1 = spy(ws1, 'send');
    const sendSpy2 = spy(ws2, 'send');

    manager.broadcastMessage({
      type: 'test_message',
      payload: { test: true },
    });

    assertEquals(sendSpy1.calls.length, 1);
    assertEquals(sendSpy2.calls.length, 1);
  });

  it('should handle notification triggers', async () => {
    const sendNotificationSpy = spy(mockServer, 'sendNotification');

    await manager['triggerNotification']({
      method: 'notifications/tools/list_changed',
      params: {},
    });

    assertEquals(sendNotificationSpy.calls.length, 1);
    assertEquals(
      sendNotificationSpy.calls[0].args[0],
      'notifications/tools/list_changed',
    );
  });
});
```

## Integration Tests

### WebSocket Communication Tests

```typescript
// tests/integration/websocket/messaging.test.ts

import { assertEquals, assertExists } from '@std/testing/asserts';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';

describe('WebSocket Messaging', () => {
  let serverProcess: Deno.ChildProcess;
  let ws: WebSocket;

  beforeAll(async () => {
    // Start test server
    serverProcess = new Deno.Command('deno', {
      args: ['run', '--allow-all', 'main.ts'],
      env: {
        MCP_TRANSPORT: 'http',
        HTTP_PORT: '3001',
      },
    }).spawn();

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(() => {
    ws?.close();
    serverProcess?.kill();
  });

  it('should establish WebSocket connection', async () => {
    return new Promise((resolve, reject) => {
      ws = new WebSocket('ws://localhost:3001/ws/console');

      ws.onopen = () => {
        resolve();
      };

      ws.onerror = (error) => {
        reject(error);
      };

      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
  });

  it('should receive connection_established message', async () => {
    return new Promise((resolve, reject) => {
      ws = new WebSocket('ws://localhost:3001/ws/console');

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'connection_established') {
          assertExists(message.payload.connectionId);
          assertExists(message.payload.timestamp);
          assertEquals(message.payload.serverVersion, '1.0.0');
          resolve();
        }
      };

      ws.onerror = (error) => reject(error);
      setTimeout(() => reject(new Error('Message timeout')), 5000);
    });
  });

  it('should handle get_clients command', async () => {
    return new Promise((resolve, reject) => {
      ws = new WebSocket('ws://localhost:3001/ws/console');

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'get_clients',
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'client_list') {
          assertExists(message.payload.clients);
          assertEquals(Array.isArray(message.payload.clients), true);
          resolve();
        }
      };

      ws.onerror = (error) => reject(error);
      setTimeout(() => reject(new Error('Response timeout')), 5000);
    });
  });
});
```

### MCP Protocol Tests

```typescript
// tests/integration/mcp/toolCalls.test.ts

import { assertEquals } from '@std/testing/asserts';
import { describe, it } from '@std/testing/bdd';
import { createMcpTestClient } from '../../utils/mockClients.ts';

describe('MCP Tool Calls', () => {
  it('should execute echo tool successfully', async () => {
    const client = await createMcpTestClient();

    const response = await client.callTool({
      name: 'echo',
      arguments: {
        message: 'test message',
      },
    });

    assertEquals(response.content[0].type, 'text');
    assertEquals(response.content[0].text, 'test message');

    await client.close();
  });

  it('should handle tool errors gracefully', async () => {
    const client = await createMcpTestClient();

    const response = await client.callTool({
      name: 'trigger_error',
      arguments: {
        errorType: 'validation',
        message: 'Test error',
      },
    });

    assertEquals(response.isError, true);

    await client.close();
  });

  it('should handle unknown tools', async () => {
    const client = await createMcpTestClient();

    try {
      await client.callTool({
        name: 'nonexistent_tool',
        arguments: {},
      });
      throw new Error('Should have thrown');
    } catch (error) {
      assertEquals(error.code, -32003); // ToolNotFound
    }

    await client.close();
  });
});
```

### Sampling Tests

```typescript
// tests/integration/mcp/sampling.test.ts

import { assertEquals, assertExists } from '@std/testing/asserts';
import { describe, it } from '@std/testing/bdd';
import { createMcpTestClient, MockSamplingClient } from '../../utils/mockClients.ts';

describe('Sampling Integration', () => {
  it('should send sampling request to client', async () => {
    const mcpClient = new MockSamplingClient();
    const server = await createTestServer();

    await mcpClient.connect(server);

    // Trigger sampling from console
    const ws = new WebSocket('ws://localhost:3001/ws/console');

    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'request_sampling',
          payload: {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: 'Test prompt',
                },
              },
            ],
            maxTokens: 100,
          },
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'sampling_response') {
          assertExists(message.payload.content);
          assertEquals(message.payload.content.type, 'text');
          resolve();
        }
      };

      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  });

  it('should handle sampling errors', async () => {
    const mcpClient = new MockSamplingClient({ failSampling: true });
    const server = await createTestServer();

    await mcpClient.connect(server);

    // Trigger sampling that will fail
    const ws = new WebSocket('ws://localhost:3001/ws/console');

    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'request_sampling',
          payload: {
            messages: [{
              role: 'user',
              content: { type: 'text', text: 'test' },
            }],
          },
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'sampling_error') {
          assertExists(message.payload.error);
          resolve();
        }
      };

      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  });
});
```

## End-to-End Tests

```typescript
// tests/e2e/fullFlow.test.ts

import { assertEquals, assertExists } from '@std/testing/asserts';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';

describe('Full Inspector Flow', () => {
  let serverProcess: Deno.ChildProcess;
  let mcpClient: MockMcpClient;
  let ws: WebSocket;

  beforeAll(async () => {
    // Start server
    serverProcess = startTestServer();
    await waitForServer();

    // Connect MCP client
    mcpClient = new MockMcpClient();
    await mcpClient.connect();

    // Connect console
    ws = await connectConsole();
  });

  afterAll(async () => {
    ws?.close();
    await mcpClient?.disconnect();
    serverProcess?.kill();
  });

  it('should complete full inspection workflow', async () => {
    // 1. Console connects and sees client
    const clients = await getClientsFromConsole(ws);
    assertEquals(clients.length, 1);
    assertEquals(clients[0].name, 'Test Client');

    // 2. MCP client calls tool
    const toolResult = await mcpClient.callTool('echo', {
      message: 'test',
    });
    assertEquals(toolResult.content[0].text, 'test');

    // 3. Console sees the tool call message
    const messages = await getMessagesFromConsole(ws);
    const toolCallMsg = messages.find((m) =>
      m.type === 'mcp_message' &&
      m.payload.message.method === 'tools/call'
    );
    assertExists(toolCallMsg);

    // 4. Console triggers notification
    await triggerNotification(ws, 'notifications/tools/list_changed');

    // 5. MCP client receives notification
    const notification = await mcpClient.waitForNotification();
    assertEquals(notification.method, 'notifications/tools/list_changed');

    // 6. Console requests sampling
    const samplingResponse = await requestSampling(ws, {
      messages: [{
        role: 'user',
        content: { type: 'text', text: 'test' },
      }],
    });
    assertExists(samplingResponse.content);
  });
});
```

## Test Utilities

### Mock Clients

```typescript
// tests/utils/mockClients.ts

export class MockBeyondMcpServer {
  async sendNotification(method: string, params?: unknown): Promise<void> {
    // Mock implementation
  }

  async createMessage(request: unknown): Promise<unknown> {
    return {
      content: { type: 'text', text: 'Mock response' },
    };
  }

  async elicitInput(request: unknown): Promise<unknown> {
    return {
      action: 'accept',
      content: { test: true },
    };
  }
}

export class MockMcpClient {
  async connect(): Promise<void> {
    // Connect to test server
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    // Make tool call
  }

  async waitForNotification(): Promise<unknown> {
    // Wait for notification
  }

  async disconnect(): Promise<void> {
    // Disconnect
  }
}
```

### Test Helpers

```typescript
// tests/utils/testHelpers.ts

export function startTestServer(): Deno.ChildProcess {
  return new Deno.Command('deno', {
    args: ['run', '--allow-all', 'main.ts'],
    env: {
      MCP_TRANSPORT: 'http',
      HTTP_PORT: '3001',
      LOG_LEVEL: 'error',
    },
  }).spawn();
}

export async function waitForServer(
  port: number = 3001,
  maxAttempts: number = 10,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) return;
    } catch {
      // Server not ready
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Server failed to start');
}

export async function connectConsole(
  port: number = 3001,
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/console`);
    ws.onopen = () => resolve(ws);
    ws.onerror = reject;
    setTimeout(() => reject(new Error('Connection timeout')), 5000);
  });
}
```

## Test Coverage

### Coverage Targets

- **Overall**: >80%
- **Critical paths**: >95%
  - Tool execution
  - WebSocket messaging
  - Sampling/elicitation
  - Notification handling

### Running Coverage

```bash
# MCP Server coverage
cd mcp-server
deno test --coverage=coverage --allow-all tests/
deno coverage coverage

# Generate HTML report
deno coverage coverage --html
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: denoland/setup-deno@v1
        with:
          deno-version: v2.x

      - name: Run MCP Server tests
        run: |
          cd mcp-server
          deno test --allow-all --coverage=coverage tests/

      - name: Check coverage
        run: |
          cd mcp-server
          deno coverage coverage --lcov > coverage.lcov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./mcp-server/coverage.lcov
```

## Performance Testing

### Load Testing

```typescript
// tests/performance/load.test.ts

import { assertEquals } from '@std/testing/asserts';

Deno.test('should handle multiple concurrent connections', async () => {
  const connections: WebSocket[] = [];
  const connectionCount = 50;

  // Create multiple connections
  for (let i = 0; i < connectionCount; i++) {
    const ws = new WebSocket('ws://localhost:3001/ws/console');
    connections.push(ws);
  }

  // Wait for all to connect
  await Promise.all(
    connections.map(
      (ws) =>
        new Promise((resolve) => {
          ws.onopen = resolve;
        }),
    ),
  );

  assertEquals(connections.length, connectionCount);

  // Close all
  connections.forEach((ws) => ws.close());
});
```

---

**Document Version**: 1.0 **Last Updated**: 2025-10-22 **Status**: Design
Complete - Ready for Implementation
