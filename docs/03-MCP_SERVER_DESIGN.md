# MCP Server Design - Detailed Implementation

## Overview

This document provides detailed implementation specifications for the MCP Server
component of the Client Inspector. The server uses the bb-mcp-server library
(AppServer pattern) with the MCP TypeScript SDK v1.18.2.

## Project Structure

```
mcp-server/
├── main.ts                          # Entry point
├── deno.json                        # Deno configuration
├── .env.example                     # Environment template
├── .env                             # Local environment (gitignored)
├── mcp_server_instructions.md       # LLM context instructions
├── src/
│   ├── plugins/
│   │   └── inspector.plugin/
│   │       ├── plugin.ts            # Plugin definition
│   │       └── tools/
│   │           ├── echo.ts
│   │           ├── convertDate.ts
│   │           ├── calculate.ts
│   │           ├── delayResponse.ts
│   │           ├── randomData.ts
│   │           └── triggerError.ts
│   ├── console/
│   │   ├── ConsoleManager.ts        # WebSocket endpoint manager
│   │   ├── MessageTracker.ts        # Message tracking and storage
│   │   └── types.ts                 # Console-specific types
│   └── dependencyHelper.ts          # Dependency injection setup
└── tests/
    ├── tools/                       # Tool tests
    ├── console/                     # Console integration tests
    └── integration/                 # End-to-end tests
```

## Entry Point (main.ts)

```typescript
#!/usr/bin/env -S deno run --allow-all --unstable-kv

/**
 * MCP Server Client Inspector
 *
 * An MCP server for testing and inspecting MCP client implementations.
 * Provides basic tools and console integration for testing sampling,
 * elicitation, and notification handling.
 */

import { AppServer } from '@beyondbetter/bb-mcp-server';
import { createInspectorDependencies } from './src/dependencyHelper.ts';

async function main(): Promise<void> {
  try {
    console.log('🔍 Starting MCP Client Inspector Server...');

    // Create AppServer with inspector dependencies
    const appServer = await AppServer.create(createInspectorDependencies);

    // Start the server
    await appServer.start();

    const transport = Deno.env.get('MCP_TRANSPORT') || 'stdio';
    const port = Deno.env.get('HTTP_PORT') || '3000';

    console.log('✅ MCP Client Inspector Server started successfully!');
    console.log(`📡 Transport: ${transport}`);

    if (transport === 'http') {
      console.log(`🌐 HTTP endpoint: http://localhost:${port}/mcp`);
      console.log(`🔌 WebSocket console: ws://localhost:${port}/ws/console`);
    }

    console.log('🛠️  Inspector tools loaded:');
    console.log('   - echo');
    console.log('   - convert_date');
    console.log('   - calculate');
    console.log('   - delay_response');
    console.log('   - random_data');
    console.log('   - trigger_error');
  } catch (error) {
    console.error('❌ Failed to start MCP Client Inspector Server:', error);
    Deno.exit(1);
  }
}

// Handle clean shutdown
Deno.addSignalListener('SIGINT', () => {
  console.log('\n🛑 Shutting down MCP Client Inspector Server...');
  Deno.exit(0);
});

if (import.meta.main) {
  main();
}
```

## Dependency Helper

```typescript
// src/dependencyHelper.ts

import {
  AppServerDependencies,
  AuditLogger,
  ConfigManager,
  KVManager,
  Logger,
} from '@beyondbetter/bb-mcp-server';
import { ConsoleManager } from './console/ConsoleManager.ts';
import { MessageTracker } from './console/MessageTracker.ts';

/**
 * Extended dependencies for Inspector server
 */
interface InspectorDependencies extends AppServerDependencies {
  consoleManager?: ConsoleManager;
  messageTracker?: MessageTracker;
}

/**
 * Create dependencies for Inspector server
 *
 * This follows the bb-mcp-server pattern but adds console-specific
 * dependencies for the inspector functionality.
 */
export async function createInspectorDependencies(): Promise<
  InspectorDependencies
> {
  // Create logger
  const logger = new Logger({
    level: Deno.env.get('LOG_LEVEL') || 'info',
    format: Deno.env.get('LOG_FORMAT') as 'text' | 'json' || 'text',
  });

  // Create audit logger
  const auditLogger = new AuditLogger({
    enabled: Deno.env.get('AUDIT_ENABLED') === 'true',
    logger,
  });

  // Create config manager
  const configManager = new ConfigManager();

  // Create KV manager for message storage
  const kvPath = Deno.env.get('STORAGE_DENO_KV_PATH') || './data/inspector.db';
  const kv = await Deno.openKv(kvPath);
  const kvManager = new KVManager(kv);

  // Create message tracker
  const messageTracker = new MessageTracker(kv, logger);

  // Note: ConsoleManager will be created after BeyondMcpServer is available
  // It will be initialized in a post-initialization hook

  return {
    logger,
    auditLogger,
    configManager,
    kvManager,
    messageTracker,
  };
}
```

## Inspector Plugin

### Plugin Definition (plugin.ts)

```typescript
// src/plugins/inspector.plugin/plugin.ts

import { AppPlugin } from '@beyondbetter/bb-mcp-server';
import { echoTool } from './tools/echo.ts';
import { convertDateTool } from './tools/convertDate.ts';
import { calculateTool } from './tools/calculate.ts';
import { delayResponseTool } from './tools/delayResponse.ts';
import { randomDataTool } from './tools/randomData.ts';
import { triggerErrorTool } from './tools/triggerError.ts';

const InspectorPlugin: AppPlugin = {
  name: 'inspector',
  version: '1.0.0',
  description: 'Inspector tools for testing MCP client implementations',

  // Declarative tool registration
  tools: [
    echoTool,
    convertDateTool,
    calculateTool,
    delayResponseTool,
    randomDataTool,
    triggerErrorTool,
  ],

  workflows: [], // No workflows in v1.0
};

export default InspectorPlugin;
```

## Inspector Tools

### 1. Echo Tool

```typescript
// src/plugins/inspector.plugin/tools/echo.ts

import { z } from 'zod';
import { ToolDefinition, ToolHandler } from '@beyondbetter/bb-mcp-server';

export const echoTool = {
  name: 'echo',
  definition: {
    title: 'Echo',
    description: 'Echo back the provided message, optionally with a delay',
    category: 'Testing',
    inputSchema: {
      message: z.string().describe('Message to echo back'),
      delay: z.number().int().min(0).max(10000).optional()
        .describe('Delay in milliseconds before responding (0-10000)'),
      uppercase: z.boolean().optional()
        .describe('Convert message to uppercase'),
    },
  } as ToolDefinition,
  handler: async (args: {
    message: string;
    delay?: number;
    uppercase?: boolean;
  }) => {
    // Apply delay if specified
    if (args.delay && args.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, args.delay));
    }

    // Transform message if requested
    let responseMessage = args.message;
    if (args.uppercase) {
      responseMessage = responseMessage.toUpperCase();
    }

    return {
      content: [{
        type: 'text' as const,
        text: responseMessage,
      }],
    };
  } as ToolHandler,
};
```

### 2. Convert Date Tool

```typescript
// src/plugins/inspector.plugin/tools/convertDate.ts

import { z } from 'zod';
import { ToolDefinition, ToolHandler } from '@beyondbetter/bb-mcp-server';

export const convertDateTool = {
  name: 'convert_date',
  definition: {
    title: 'Convert Date',
    description: 'Convert date between formats and timezones',
    category: 'Utility',
    inputSchema: {
      date: z.string().describe('Date string to convert (ISO 8601 format)'),
      fromTimezone: z.string().default('UTC')
        .describe('Source timezone (e.g., "UTC", "America/New_York")'),
      toTimezone: z.string().default('UTC')
        .describe('Target timezone'),
      format: z.enum(['iso', 'human', 'unix', 'date-only', 'time-only']).default('iso')
        .describe('Output format'),
    },
  } as ToolDefinition,
  handler: async (args: {
    date: string;
    fromTimezone?: string;
    toTimezone?: string;
    format?: 'iso' | 'human' | 'unix' | 'date-only' | 'time-only';
  }) => {
    try {
      const date = new Date(args.date);
      
      if (isNaN(date.getTime())) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Invalid date format. Please use ISO 8601 format.',
          }],
          isError: true,
        };
      }

      let result: string;
      const format = args.format || 'iso';

      switch (format) {
        case 'iso':
          result = date.toISOString();
          break;
        case 'human':
          result = date.toLocaleString('en-US', {
            timeZone: args.toTimezone || 'UTC',
            dateStyle: 'full',
            timeStyle: 'long',
          });
          break;
        case 'unix':
          result = Math.floor(date.getTime() / 1000).toString();
          break;
        case 'date-only':
          result = date.toLocaleDateString('en-US', {
            timeZone: args.toTimezone || 'UTC',
          });
          break;
        case 'time-only':
          result = date.toLocaleTimeString('en-US', {
            timeZone: args.toTimezone || 'UTC',
          });
          break;
        default:
          result = date.toISOString();
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            original: args.date,
            converted: result,
            format,
            timezone: args.toTimezone || 'UTC',
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error converting date: ${error.message}`,
        }],
        isError: true,
      };
    }
  } as ToolHandler,
};
```

### 3. Calculate Tool

```typescript
// src/plugins/inspector.plugin/tools/calculate.ts

import { z } from 'zod';
import { ToolDefinition, ToolHandler } from '@beyondbetter/bb-mcp-server';

export const calculateTool = {
  name: 'calculate',
  definition: {
    title: 'Calculate',
    description: 'Perform basic arithmetic calculations',
    category: 'Utility',
    inputSchema: {
      operation: z.enum(['add', 'subtract', 'multiply', 'divide', 'power', 'modulo'])
        .describe('Arithmetic operation to perform'),
      a: z.number().describe('First operand'),
      b: z.number().describe('Second operand'),
    },
  } as ToolDefinition,
  handler: async (args: {
    operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'modulo';
    a: number;
    b: number;
  }) => {
    let result: number;

    try {
      switch (args.operation) {
        case 'add':
          result = args.a + args.b;
          break;
        case 'subtract':
          result = args.a - args.b;
          break;
        case 'multiply':
          result = args.a * args.b;
          break;
        case 'divide':
          if (args.b === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: 'Error: Division by zero',
              }],
              isError: true,
            };
          }
          result = args.a / args.b;
          break;
        case 'power':
          result = Math.pow(args.a, args.b);
          break;
        case 'modulo':
          result = args.a % args.b;
          break;
        default:
          return {
            content: [{
              type: 'text' as const,
              text: 'Invalid operation',
            }],
            isError: true,
          };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            operation: args.operation,
            operands: [args.a, args.b],
            result,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Calculation error: ${error.message}`,
        }],
        isError: true,
      };
    }
  } as ToolHandler,
};
```

### 4. Delay Response Tool

```typescript
// src/plugins/inspector.plugin/tools/delayResponse.ts

import { z } from 'zod';
import { ToolDefinition, ToolHandler } from '@beyondbetter/bb-mcp-server';

export const delayResponseTool = {
  name: 'delay_response',
  definition: {
    title: 'Delay Response',
    description: 'Delay the response by a specified duration (for testing timeouts)',
    category: 'Testing',
    inputSchema: {
      delay: z.number().int().min(0).max(60000)
        .describe('Delay duration in milliseconds (0-60000)'),
      message: z.string().optional()
        .describe('Optional message to return after delay'),
    },
  } as ToolDefinition,
  handler: async (args: {
    delay: number;
    message?: string;
  }) => {
    const startTime = Date.now();
    
    await new Promise(resolve => setTimeout(resolve, args.delay));
    
    const actualDelay = Date.now() - startTime;

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          requestedDelay: args.delay,
          actualDelay,
          message: args.message || 'Delay completed',
        }, null, 2),
      }],
    };
  } as ToolHandler,
};
```

### 5. Random Data Tool

```typescript
// src/plugins/inspector.plugin/tools/randomData.ts

import { z } from 'zod';
import { ToolDefinition, ToolHandler } from '@beyondbetter/bb-mcp-server';

export const randomDataTool = {
  name: 'random_data',
  definition: {
    title: 'Random Data',
    description: 'Generate random test data',
    category: 'Testing',
    inputSchema: {
      type: z.enum(['number', 'string', 'boolean', 'array', 'object'])
        .describe('Type of random data to generate'),
      count: z.number().int().min(1).max(100).default(1)
        .describe('Number of items to generate (for arrays)'),
      seed: z.number().optional()
        .describe('Random seed for reproducible results'),
    },
  } as ToolDefinition,
  handler: async (args: {
    type: 'number' | 'string' | 'boolean' | 'array' | 'object';
    count?: number;
    seed?: number;
  }) => {
    // Simple random number generator (not cryptographically secure)
    let random = args.seed !== undefined 
      ? seededRandom(args.seed)
      : Math.random;

    let result: unknown;
    const count = args.count || 1;

    switch (args.type) {
      case 'number':
        result = Array.from({ length: count }, () => 
          Math.floor(random() * 1000)
        );
        break;
      
      case 'string':
        result = Array.from({ length: count }, (_, i) => 
          `test_string_${i}_${Math.random().toString(36).substring(7)}`
        );
        break;
      
      case 'boolean':
        result = Array.from({ length: count }, () => random() > 0.5);
        break;
      
      case 'array':
        result = Array.from({ length: count }, (_, i) => 
          Array.from({ length: 3 }, (_, j) => `item_${i}_${j}`)
        );
        break;
      
      case 'object':
        result = Array.from({ length: count }, (_, i) => ({
          id: i,
          name: `Object ${i}`,
          value: Math.floor(random() * 100),
          active: random() > 0.5,
        }));
        break;
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          type: args.type,
          count,
          seed: args.seed,
          data: result,
        }, null, 2),
      }],
    };
  } as ToolHandler,
};

// Simple seeded random number generator
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}
```

### 6. Trigger Error Tool

```typescript
// src/plugins/inspector.plugin/tools/triggerError.ts

import { z } from 'zod';
import { ToolDefinition, ToolHandler } from '@beyondbetter/bb-mcp-server';

export const triggerErrorTool = {
  name: 'trigger_error',
  definition: {
    title: 'Trigger Error',
    description: 'Intentionally trigger an error for testing error handling',
    category: 'Testing',
    inputSchema: {
      errorType: z.enum(['validation', 'runtime', 'timeout', 'custom'])
        .describe('Type of error to trigger'),
      message: z.string().optional()
        .describe('Custom error message'),
      delay: z.number().int().min(0).max(5000).optional()
        .describe('Delay before throwing error (ms)'),
    },
  } as ToolDefinition,
  handler: async (args: {
    errorType: 'validation' | 'runtime' | 'timeout' | 'custom';
    message?: string;
    delay?: number;
  }) => {
    // Apply delay if specified
    if (args.delay && args.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, args.delay));
    }

    const customMessage = args.message || `Triggered ${args.errorType} error`;

    switch (args.errorType) {
      case 'validation':
        return {
          content: [{
            type: 'text' as const,
            text: `Validation Error: ${customMessage}`,
          }],
          isError: true,
        };
      
      case 'runtime':
        throw new Error(`Runtime Error: ${customMessage}`);
      
      case 'timeout':
        // Simulate timeout by waiting indefinitely (tool should have timeout)
        await new Promise(() => {}); // Never resolves
        break;
      
      case 'custom':
        return {
          content: [{
            type: 'text' as const,
            text: customMessage,
          }],
          isError: true,
        };
      
      default:
        throw new Error('Unknown error type');
    }

    // Should never reach here
    return {
      content: [{
        type: 'text' as const,
        text: 'Error not triggered',
      }],
    };
  } as ToolHandler,
};
```

## Console Integration

### Console Manager

```typescript
// src/console/ConsoleManager.ts

import { BeyondMcpServer, Logger } from '@beyondbetter/bb-mcp-server';
import { MessageTracker } from './MessageTracker.ts';
import {
  ConsoleCommand,
  ConsoleMessage,
  ElicitationPayload,
  NotificationPayload,
  SamplingPayload,
} from './types.ts';

export class ConsoleManager {
  private wsConnections: Map<string, WebSocket>;
  private mcpServer: BeyondMcpServer;
  private messageTracker: MessageTracker;
  private logger: Logger;

  constructor(
    mcpServer: BeyondMcpServer,
    messageTracker: MessageTracker,
    logger: Logger,
  ) {
    this.mcpServer = mcpServer;
    this.messageTracker = messageTracker;
    this.logger = logger;
    this.wsConnections = new Map();
  }

  /**
   * Handle WebSocket upgrade request
   */
  handleWebSocket(request: Request): Response {
    const { socket, response } = Deno.upgradeWebSocket(request);
    const connectionId = crypto.randomUUID();

    socket.onopen = () => {
      this.logger.info(`Console client connected: ${connectionId}`);
      this.handleConnection(connectionId, socket);
    };

    socket.onmessage = (event) => {
      this.handleMessage(connectionId, event.data);
    };

    socket.onclose = () => {
      this.logger.info(`Console client disconnected: ${connectionId}`);
      this.handleDisconnection(connectionId);
    };

    socket.onerror = (error) => {
      this.logger.error(`WebSocket error for ${connectionId}:`, error);
    };

    return response;
  }

  /**
   * Handle new console connection
   */
  private handleConnection(connectionId: string, socket: WebSocket): void {
    this.wsConnections.set(connectionId, socket);

    // Send welcome message
    this.sendToClient(connectionId, {
      type: 'connection_established',
      payload: {
        connectionId,
        timestamp: Date.now(),
        serverVersion: '1.0.0',
      },
    });

    // Send current client list
    this.sendClientListToAll();
  }

  /**
   * Handle console disconnection
   */
  private handleDisconnection(connectionId: string): void {
    this.wsConnections.delete(connectionId);
    this.sendClientListToAll();
  }

  /**
   * Handle incoming message from console
   */
  private async handleMessage(
    connectionId: string,
    data: string,
  ): Promise<void> {
    try {
      const command = JSON.parse(data) as ConsoleCommand;
      this.logger.debug(`Console command from ${connectionId}:`, command.type);

      switch (command.type) {
        case 'trigger_notification':
          await this.triggerNotification(
            command.payload as NotificationPayload,
          );
          break;

        case 'request_sampling':
          await this.requestSampling(command.payload as SamplingPayload);
          break;

        case 'request_elicitation':
          await this.requestElicitation(command.payload as ElicitationPayload);
          break;

        case 'get_clients':
          await this.sendClientList(connectionId);
          break;

        case 'get_message_history':
          await this.sendMessageHistory(connectionId, command.payload);
          break;

        default:
          this.logger.warn(`Unknown command type: ${command.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling console message:`, error);
      this.sendToClient(connectionId, {
        type: 'error',
        payload: {
          message: 'Failed to process command',
          error: error.message,
        },
      });
    }
  }

  /**
   * Trigger notification to MCP clients
   */
  private async triggerNotification(
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      await this.mcpServer.sendNotification(
        payload.method,
        payload.params,
      );

      this.broadcastMessage({
        type: 'notification_sent',
        payload: {
          method: payload.method,
          params: payload.params,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      this.logger.error('Error triggering notification:', error);
      this.broadcastMessage({
        type: 'error',
        payload: {
          message: 'Failed to send notification',
          error: error.message,
        },
      });
    }
  }

  /**
   * Request sampling from MCP client
   */
  private async requestSampling(payload: SamplingPayload): Promise<void> {
    try {
      const response = await this.mcpServer.createMessage({
        messages: payload.messages,
        modelPreferences: payload.modelPreferences,
        maxTokens: payload.maxTokens,
      });

      this.broadcastMessage({
        type: 'sampling_response',
        payload: response,
      });
    } catch (error) {
      this.logger.error('Error requesting sampling:', error);
      this.broadcastMessage({
        type: 'sampling_error',
        payload: {
          message: 'Sampling request failed',
          error: error.message,
        },
      });
    }
  }

  /**
   * Request elicitation from MCP client
   */
  private async requestElicitation(payload: ElicitationPayload): Promise<void> {
    try {
      const response = await this.mcpServer.elicitInput({
        message: payload.message,
        requestedSchema: payload.requestedSchema,
      });

      this.broadcastMessage({
        type: 'elicitation_response',
        payload: response,
      });
    } catch (error) {
      this.logger.error('Error requesting elicitation:', error);
      this.broadcastMessage({
        type: 'elicitation_error',
        payload: {
          message: 'Elicitation request failed',
          error: error.message,
        },
      });
    }
  }

  /**
   * Send client list to specific console
   */
  private async sendClientList(connectionId: string): Promise<void> {
    const clients = await this.messageTracker.getClients();
    this.sendToClient(connectionId, {
      type: 'client_list',
      payload: { clients },
    });
  }

  /**
   * Send client list to all consoles
   */
  private async sendClientListToAll(): Promise<void> {
    const clients = await this.messageTracker.getClients();
    this.broadcastMessage({
      type: 'client_list',
      payload: { clients },
    });
  }

  /**
   * Send message history to console
   */
  private async sendMessageHistory(
    connectionId: string,
    payload: { sessionId?: string; limit?: number },
  ): Promise<void> {
    try {
      const messages = await this.messageTracker.getMessages(
        payload.sessionId || 'default',
        payload.limit || 100,
      );

      this.sendToClient(connectionId, {
        type: 'message_history',
        payload: { messages },
      });
    } catch (error) {
      this.logger.error('Error getting message history:', error);
      this.sendToClient(connectionId, {
        type: 'error',
        payload: {
          message: 'Failed to retrieve message history',
          error: error.message,
        },
      });
    }
  }

  /**
   * Broadcast MCP protocol message to all consoles
   */
  broadcastMessage(message: ConsoleMessage): void {
    const payload = JSON.stringify(message);

    for (const [id, ws] of this.wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (error) {
          this.logger.error(`Error sending to console ${id}:`, error);
        }
      }
    }
  }

  /**
   * Send message to specific console
   */
  private sendToClient(connectionId: string, message: ConsoleMessage): void {
    const ws = this.wsConnections.get(connectionId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        this.logger.error(`Error sending to console ${connectionId}:`, error);
      }
    }
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.wsConnections.size;
  }
}
```

### Message Tracker

```typescript
// src/console/MessageTracker.ts

import { Logger } from '@beyondbetter/bb-mcp-server';
import { ClientInfo, McpMessage, MessageEntry } from './types.ts';

export class MessageTracker {
  private kv: Deno.Kv;
  private logger: Logger;
  private messageLimit: number;
  private retentionDays: number;

  constructor(kv: Deno.Kv, logger: Logger) {
    this.kv = kv;
    this.logger = logger;
    this.messageLimit = parseInt(
      Deno.env.get('MESSAGE_HISTORY_LIMIT') || '1000',
    );
    this.retentionDays = parseInt(
      Deno.env.get('MESSAGE_HISTORY_RETENTION_DAYS') || '7',
    );
  }

  /**
   * Track MCP protocol message
   */
  async trackMessage(
    sessionId: string,
    direction: 'incoming' | 'outgoing',
    message: McpMessage,
  ): Promise<void> {
    const entry: MessageEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      sessionId,
      direction,
      message,
    };

    try {
      // Store message
      await this.kv.set(
        ['messages', sessionId, entry.timestamp.toString(), entry.id],
        entry,
      );

      this.logger.debug(
        `Tracked ${direction} message:`,
        message.method || 'response',
      );

      // Clean up old messages if needed
      await this.cleanupOldMessages(sessionId);
    } catch (error) {
      this.logger.error('Error tracking message:', error);
    }
  }

  /**
   * Get message history for session
   */
  async getMessages(
    sessionId: string,
    limit: number = 100,
  ): Promise<MessageEntry[]> {
    const messages: MessageEntry[] = [];

    try {
      const iter = this.kv.list<MessageEntry>({
        prefix: ['messages', sessionId],
      });

      for await (const entry of iter) {
        messages.push(entry.value);
        if (messages.length >= limit) break;
      }

      // Sort by timestamp (ascending)
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      this.logger.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * Track MCP client connection
   */
  async trackClient(clientId: string, info: ClientInfo): Promise<void> {
    try {
      await this.kv.set(
        ['clients', clientId],
        {
          ...info,
          lastSeen: Date.now(),
        },
      );

      this.logger.info(`Tracked client: ${clientId}`);
    } catch (error) {
      this.logger.error('Error tracking client:', error);
    }
  }

  /**
   * Get all tracked clients
   */
  async getClients(): Promise<ClientInfo[]> {
    const clients: ClientInfo[] = [];

    try {
      const iter = this.kv.list<ClientInfo>({
        prefix: ['clients'],
      });

      for await (const entry of iter) {
        clients.push(entry.value);
      }

      return clients;
    } catch (error) {
      this.logger.error('Error getting clients:', error);
      return [];
    }
  }

  /**
   * Clean up old messages
   */
  private async cleanupOldMessages(sessionId: string): Promise<void> {
    try {
      const cutoffTime = Date.now() -
        (this.retentionDays * 24 * 60 * 60 * 1000);

      const iter = this.kv.list<MessageEntry>({
        prefix: ['messages', sessionId],
      });

      let count = 0;
      const toDelete: Deno.KvKey[] = [];

      for await (const entry of iter) {
        if (entry.value.timestamp < cutoffTime) {
          toDelete.push(entry.key);
        }
        count++;
      }

      // Delete old messages
      for (const key of toDelete) {
        await this.kv.delete(key);
      }

      // If still over limit, delete oldest
      if (count > this.messageLimit) {
        const messages = await this.getMessages(sessionId, count);
        const toDeleteCount = count - this.messageLimit;

        for (let i = 0; i < toDeleteCount && i < messages.length; i++) {
          await this.kv.delete([
            'messages',
            sessionId,
            messages[i].timestamp.toString(),
            messages[i].id,
          ]);
        }
      }
    } catch (error) {
      this.logger.error('Error cleaning up messages:', error);
    }
  }
}
```

## Configuration

### deno.json

```json
{
  "name": "@beyondbetter/mcp-client-inspector-server",
  "version": "1.0.0",
  "exports": "./main.ts",
  "tasks": {
    "start": "deno run --allow-all --unstable-kv main.ts",
    "dev": "deno run --allow-all --unstable-kv --watch main.ts",
    "test": "deno test --allow-all --unstable-kv tests/",
    "test:watch": "deno test --allow-all --unstable-kv --watch tests/",
    "check": "deno check main.ts src/**/*.ts",
    "lint": "deno lint",
    "fmt": "deno fmt"
  },
  "imports": {
    "@beyondbetter/bb-mcp-server": "jsr:@beyondbetter/bb-mcp-server@^1.0.0",
    "@std/": "jsr:@std/",
    "zod": "npm:zod@^3.22.4"
  },
  "compilerOptions": {
    "lib": ["deno.window"],
    "strict": true
  }
}
```

### .env.example

```bash
# Transport Configuration
MCP_TRANSPORT=http                    # stdio or http
HTTP_PORT=3000
HTTP_HOST=localhost

# Console WebSocket
CONSOLE_WS_PATH=/ws/console

# Storage
STORAGE_DENO_KV_PATH=./data/inspector.db

# Message History
MESSAGE_HISTORY_LIMIT=1000
MESSAGE_HISTORY_RETENTION_DAYS=7

# Logging
LOG_LEVEL=info                        # debug, info, warn, error
LOG_FORMAT=text                       # text or json

# Audit
AUDIT_ENABLED=false

# Development
DEV_MODE=false
```

---

**Document Version**: 1.0 **Last Updated**: 2025-10-22 **Status**: Design
Complete - Ready for Implementation
