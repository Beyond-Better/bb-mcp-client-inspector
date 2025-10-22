# MCP Server Client Inspector - Architecture

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Clients                              │
│                    (Testing Targets)                            │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ MCP Protocol
             │ (STDIO or HTTP)
             │
┌────────────▼─────────────────────────────────────────────────────┐
│                      MCP Server                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              AppServer (bb-mcp-server)                  │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │         BeyondMcpServer                        │     │    │
│  │  │  - Protocol handling (SDK 1.18.2)              │     │    │
│  │  │  - Transport management (STDIO/HTTP)           │     │    │
│  │  │  - Tool/workflow registration                  │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │         Inspector Plugin                       │     │    │
│  │  │  - echo                                        │     │    │
│  │  │  - convert_date                                │     │    │
│  │  │  - calculate                                   │     │    │
│  │  │  - delay_response                              │     │    │
│  │  │  - random_data                                 │     │    │
│  │  │  - trigger_error                               │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │         Console Manager                        │     │    │
│  │  │  - WebSocket endpoint (/ws/console)            │     │    │
│  │  │  - Message broadcasting                        │     │    │
│  │  │  - Client tracking                             │     │    │
│  │  │  - Notification triggers                       │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │         Message Tracker                        │     │    │
│  │  │  - Protocol message capture                    │     │    │
│  │  │  - Session management (Deno KV)                │     │    │
│  │  │  - Message history                             │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ WebSocket
             │ (Console Protocol)
             │
┌────────────▼─────────────────────────────────────────────────────┐
│                    Fresh UI Server                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Fresh App                                  │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │         Routes                                 │     │    │
│  │  │  - / (Console UI)                              │     │    │
│  │  │  - /api/* (if needed)                          │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │         Islands (Interactive Components)       │     │    │
│  │  │  - ConnectionStatus                            │     │    │
│  │  │  - ClientSelector                              │     │    │
│  │  │  - SamplingForm                                │     │    │
│  │  │  - ElicitationForm                             │     │    │
│  │  │  - NotificationTrigger                         │     │    │
│  │  │  - MessageViewer                               │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │         WebSocket Client                       │     │    │
│  │  │  - Connection management                       │     │    │
│  │  │  - Message handling                            │     │    │
│  │  │  - Auto-reconnection                           │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### MCP Server Components

#### 1. AppServer (bb-mcp-server)

**Responsibilities**:
- MCP server lifecycle management
- Plugin discovery and loading
- Dependency injection
- Configuration management

**Key Classes**:
```typescript
class AppServer {
  static async create(dependenciesFactory: DependenciesFactory): Promise<AppServer>
  async start(): Promise<void>
  async stop(): Promise<void>
}
```

**Integration Points**:
- Loads inspector plugin from `src/plugins/inspector.plugin/`
- Initializes ConsoleManager with BeyondMcpServer instance
- Provides MessageTracker access to protocol events

#### 2. BeyondMcpServer (from bb-mcp-server)

**Responsibilities**:
- MCP protocol implementation (SDK 1.18.2)
- JSON-RPC message handling
- Tool and workflow registration
- Transport management (STDIO/HTTP)

**Key Interfaces**:
```typescript
interface BeyondMcpServer {
  // Tool management
  registerTool(name: string, definition: ToolDefinition, handler: ToolHandler): void
  
  // Notification sending
  sendNotification(method: string, params?: unknown): Promise<void>
  
  // Sampling (createMessage)
  createMessage(request: CreateMessageRequest): Promise<CreateMessageResponse>
  
  // Elicitation
  elicitInput(request: ElicitInputRequest): Promise<ElicitInputResponse>
}
```

#### 3. Inspector Plugin

**Structure**:
```
inspector.plugin/
├── plugin.ts              # Plugin definition
└── tools/
    ├── echo.ts
    ├── convertDate.ts
    ├── calculate.ts
    ├── delayResponse.ts
    ├── randomData.ts
    └── triggerError.ts
```

**Plugin Definition**:
```typescript
const InspectorPlugin: AppPlugin = {
  name: 'inspector',
  version: '1.0.0',
  description: 'Inspector tools for testing MCP clients',
  
  tools: [
    // Array of tool definitions
    {
      name: 'echo',
      definition: { /* ... */ },
      handler: async (args) => { /* ... */ }
    },
    // ... more tools
  ],
  
  workflows: [] // Empty for v1.0
};
```

**Tool Pattern**:
```typescript
export const echoTool = {
  name: 'echo',
  definition: {
    title: 'Echo',
    description: 'Echo back the provided message',
    category: 'Testing',
    inputSchema: {
      message: z.string().describe('Message to echo'),
      delay: z.number().optional().describe('Delay in ms before responding')
    }
  },
  handler: async (args: { message: string; delay?: number }) => {
    if (args.delay) {
      await new Promise(resolve => setTimeout(resolve, args.delay));
    }
    return {
      content: [{
        type: 'text',
        text: args.message
      }]
    };
  }
};
```

#### 4. Console Manager

**Responsibilities**:
- WebSocket server endpoint
- UI client connection management
- Message broadcasting to UI
- Command handling from UI
- Notification triggering

**Class Structure**:
```typescript
class ConsoleManager {
  private wsConnections: Map<string, WebSocket>;
  private mcpServer: BeyondMcpServer;
  private messageTracker: MessageTracker;
  
  constructor(mcpServer: BeyondMcpServer, messageTracker: MessageTracker) {
    this.mcpServer = mcpServer;
    this.messageTracker = messageTracker;
    this.wsConnections = new Map();
  }
  
  // WebSocket endpoint handler
  handleWebSocket(request: Request): Response {
    const { socket, response } = Deno.upgradeWebSocket(request);
    const connectionId = crypto.randomUUID();
    
    socket.onopen = () => this.handleConnection(connectionId, socket);
    socket.onmessage = (e) => this.handleMessage(connectionId, e.data);
    socket.onclose = () => this.handleDisconnection(connectionId);
    
    return response;
  }
  
  // Broadcast MCP message to all UI clients
  broadcastMessage(message: ConsoleMessage): void {
    const payload = JSON.stringify(message);
    for (const [id, ws] of this.wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
  
  // Handle commands from UI
  private async handleMessage(connectionId: string, data: string): Promise<void> {
    const command = JSON.parse(data) as ConsoleCommand;
    
    switch (command.type) {
      case 'trigger_notification':
        await this.triggerNotification(command.payload);
        break;
      case 'request_sampling':
        await this.requestSampling(command.payload);
        break;
      case 'request_elicitation':
        await this.requestElicitation(command.payload);
        break;
      case 'get_clients':
        await this.sendClientList(connectionId);
        break;
    }
  }
  
  // Trigger notification to MCP clients
  private async triggerNotification(payload: NotificationPayload): Promise<void> {
    await this.mcpServer.sendNotification(
      payload.method,
      payload.params
    );
  }
  
  // Request sampling from MCP client
  private async requestSampling(payload: SamplingPayload): Promise<void> {
    try {
      const response = await this.mcpServer.createMessage({
        messages: payload.messages,
        modelPreferences: payload.modelPreferences,
        maxTokens: payload.maxTokens
      });
      
      this.broadcastMessage({
        type: 'sampling_response',
        payload: response
      });
    } catch (error) {
      this.broadcastMessage({
        type: 'sampling_error',
        payload: { error: error.message }
      });
    }
  }
  
  // Request elicitation from MCP client
  private async requestElicitation(payload: ElicitationPayload): Promise<void> {
    try {
      const response = await this.mcpServer.elicitInput({
        message: payload.message,
        requestedSchema: payload.requestedSchema
      });
      
      this.broadcastMessage({
        type: 'elicitation_response',
        payload: response
      });
    } catch (error) {
      this.broadcastMessage({
        type: 'elicitation_error',
        payload: { error: error.message }
      });
    }
  }
}
```

#### 5. Message Tracker

**Responsibilities**:
- Capture MCP protocol messages
- Store message history per session
- Provide message retrieval
- Session management

**Class Structure**:
```typescript
class MessageTracker {
  private kv: Deno.Kv;
  
  constructor(kv: Deno.Kv) {
    this.kv = kv;
  }
  
  // Track incoming/outgoing MCP messages
  async trackMessage(
    sessionId: string,
    direction: 'incoming' | 'outgoing',
    message: McpMessage
  ): Promise<void> {
    const entry: MessageEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      sessionId,
      direction,
      message
    };
    
    // Store in KV
    await this.kv.set(
      ['messages', sessionId, entry.id],
      entry
    );
  }
  
  // Get message history for session
  async getMessages(
    sessionId: string,
    limit: number = 100
  ): Promise<MessageEntry[]> {
    const messages: MessageEntry[] = [];
    
    for await (const entry of this.kv.list<MessageEntry>({
      prefix: ['messages', sessionId]
    })) {
      messages.push(entry.value);
      if (messages.length >= limit) break;
    }
    
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  // Track client connections
  async trackClient(clientId: string, info: ClientInfo): Promise<void> {
    await this.kv.set(
      ['clients', clientId],
      info
    );
  }
  
  // Get all connected clients
  async getClients(): Promise<ClientInfo[]> {
    const clients: ClientInfo[] = [];
    
    for await (const entry of this.kv.list<ClientInfo>({
      prefix: ['clients']
    })) {
      clients.push(entry.value);
    }
    
    return clients;
  }
}
```

### Fresh UI Components

#### 1. Fresh App Setup

**main.ts**:
```typescript
import { App } from 'fresh';
import { config } from './fresh.config.ts';

const app = new App(config);

app.listen({ port: 8000 });
```

**fresh.config.ts**:
```typescript
import { defineConfig } from 'fresh';
import tailwind from 'fresh/plugins/tailwind';

export default defineConfig({
  plugins: [tailwind()],
});
```

#### 2. Routes

**routes/index.tsx** (Console UI):
```typescript
import { PageProps } from 'fresh';
import ConnectionStatus from '../islands/ConnectionStatus.tsx';
import ClientSelector from '../islands/ClientSelector.tsx';
import SamplingForm from '../islands/SamplingForm.tsx';
import ElicitationForm from '../islands/ElicitationForm.tsx';
import NotificationTrigger from '../islands/NotificationTrigger.tsx';
import MessageViewer from '../islands/MessageViewer.tsx';

export default function Console(props: PageProps) {
  const wsUrl = Deno.env.get('MCP_SERVER_WS_URL') || 'ws://localhost:3000/ws/console';
  
  return (
    <div class="container mx-auto p-4">
      <header class="mb-6">
        <h1 class="text-3xl font-bold">MCP Client Inspector</h1>
        <ConnectionStatus wsUrl={wsUrl} />
      </header>
      
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-8">
          <MessageViewer wsUrl={wsUrl} />
        </div>
        
        <div class="col-span-4 space-y-4">
          <ClientSelector wsUrl={wsUrl} />
          <SamplingForm wsUrl={wsUrl} />
          <ElicitationForm wsUrl={wsUrl} />
          <NotificationTrigger wsUrl={wsUrl} />
        </div>
      </div>
    </div>
  );
}
```

#### 3. Islands (Interactive Components)

**Structure**:
```
islands/
├── ConnectionStatus.tsx    # WebSocket connection status
├── ClientSelector.tsx      # Multi-client selector
├── SamplingForm.tsx        # Sampling request builder
├── ElicitationForm.tsx     # Elicitation request builder
├── NotificationTrigger.tsx # Notification trigger buttons
└── MessageViewer.tsx       # Protocol message viewer
```

**WebSocket Client Pattern** (shared across islands):
```typescript
import { useEffect, useState } from 'preact/hooks';

function useWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  
  useEffect(() => {
    const socket = new WebSocket(url);
    
    socket.onopen = () => {
      setConnected(true);
      setWs(socket);
    };
    
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as ConsoleMessage;
      setMessages(prev => [...prev, message]);
    };
    
    socket.onclose = () => {
      setConnected(false);
      setWs(null);
      // Attempt reconnection
      setTimeout(() => {
        // Trigger reconnect
      }, 2000);
    };
    
    return () => {
      socket.close();
    };
  }, [url]);
  
  const sendCommand = (command: ConsoleCommand) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(command));
    }
  };
  
  return { ws, connected, messages, sendCommand };
}
```

## Data Flow

### 1. MCP Client Tool Call Flow

```
MCP Client          MCP Server          Message Tracker     Console UI
    │                   │                      │                 │
    │─tool_call────────>│                      │                 │
    │                   │─track_message───────>│                 │
    │                   │                      │─broadcast──────>│
    │                   │─execute_tool────>    │                 │
    │                   │<─result──────────    │                 │
    │<──response────────│                      │                 │
    │                   │─track_message───────>│                 │
    │                   │                      │─broadcast──────>│
```

### 2. Sampling Request Flow

```
Console UI          Console Manager     MCP Server          MCP Client
    │                   │                      │                 │
    │─request_sampling─>│                      │                 │
    │                   │─createMessage───────>│                 │
    │                   │                      │─sampling/────>  │
    │                   │                      │  createMessage  │
    │                   │                      │<─response───────│
    │                   │<─response────────────│                 │
    │<──sampling_response│                     │                 │
```

### 3. Elicitation Request Flow

```
Console UI          Console Manager     MCP Server          MCP Client
    │                   │                      │                 │
    │─request_elicit───>│                      │                 │
    │                   │─elicitInput─────────>│                 │
    │                   │                      │─elicitation/──> │
    │                   │                      │  request        │
    │                   │                      │<─response───────│
    │                   │<─response────────────│                 │
    │<──elicit_response──│                     │                 │
```

### 4. Notification Trigger Flow

```
Console UI          Console Manager     MCP Server          MCP Client
    │                   │                      │                 │
    │─trigger_notif────>│                      │                 │
    │                   │─sendNotification────>│                 │
    │                   │                      │─notifications/─>│
    │                   │                      │  list_changed   │
    │                   │                      │                 │
    │<──notif_sent───────│                     │                 │
```

## Deployment Architecture

### Development Environment

```
Terminal 1: MCP Server          Terminal 2: Fresh UI
┌────────────────────┐          ┌────────────────────┐
│ deno task dev      │          │ deno task dev      │
│ Port: 3000         │          │ Port: 8000         │
│ - STDIO: stdin/out │          │ - Hot reload: ON   │
│ - HTTP: /mcp       │          │ - WebSocket client │
│ - WebSocket: /ws/  │          │                    │
└────────────────────┘          └────────────────────┘
         │                               │
         │<──────WebSocket───────────────│
         │      ws://localhost:3000/ws/console
```

### Production Environment

```
┌─────────────────────────────────────────┐
│          Docker Container               │
│  ┌────────────────────────────────┐     │
│  │  MCP Server (Port 3000)        │     │
│  │  - HTTP: /mcp                  │     │
│  │  - WebSocket: /ws/console      │     │
│  └──────────┬─────────────────────┘     │
│             │                            │
│  ┌──────────▼─────────────────────┐     │
│  │  Fresh UI (Port 8000)          │     │
│  │  - Static build (optional)     │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
              │
        ┌─────▼─────┐
        │  Reverse  │
        │   Proxy   │
        │ (Nginx)   │
        └───────────┘
```

## Security Considerations

### WebSocket Security (Roadmap)

**Token-based Authentication**:
```typescript
class ConsoleManager {
  handleWebSocket(request: Request): Response {
    // Extract token from query params or headers
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    // Validate token (if authentication enabled)
    if (this.authEnabled && !this.validateToken(token)) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Proceed with WebSocket upgrade
    // ...
  }
  
  private validateToken(token: string | null): boolean {
    // Token validation logic (future implementation)
    return true;
  }
}
```

### CORS Configuration

**MCP Server** (for HTTP transport):
```typescript
// In dependency helper or HTTP setup
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Configure appropriately
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## Scalability Considerations

### Message History Management

- **Limit per session**: 1000 messages max
- **Auto-cleanup**: Delete old sessions after 7 days
- **Pagination**: Support paginated message retrieval

### WebSocket Connection Limits

- **Max UI connections**: 10 concurrent console connections
- **Heartbeat**: 30-second ping/pong to detect dead connections
- **Reconnection**: Automatic reconnection with exponential backoff

## Configuration

### MCP Server Environment Variables

```bash
# Transport
MCP_TRANSPORT=http                    # stdio or http
HTTP_PORT=3000
HTTP_HOST=localhost

# Console WebSocket
CONSOLE_WS_PATH=/ws/console
CONSOLE_WS_AUTH_ENABLED=false         # Token auth (roadmap)

# Storage
STORAGE_DENO_KV_PATH=./data/inspector.db

# Message History
MESSAGE_HISTORY_LIMIT=1000
MESSAGE_HISTORY_RETENTION_DAYS=7

# Logging
LOG_LEVEL=info
LOG_FORMAT=text
```

### Fresh UI Environment Variables

```bash
# WebSocket Connection
MCP_SERVER_WS_URL=ws://localhost:3000/ws/console

# UI Configuration
UI_PORT=8000
UI_HOST=localhost
```

## Error Handling Strategy

### MCP Server Errors

```typescript
// Protocol errors
try {
  await mcpServer.createMessage(request);
} catch (error) {
  if (error instanceof McpError) {
    // MCP protocol error
    consoleManager.broadcastMessage({
      type: 'error',
      payload: {
        code: error.code,
        message: error.message,
        data: error.data
      }
    });
  } else {
    // Unexpected error
    consoleManager.broadcastMessage({
      type: 'error',
      payload: {
        message: 'Internal server error'
      }
    });
  }
}
```

### WebSocket Connection Errors

```typescript
// UI WebSocket client
socket.onerror = (event) => {
  console.error('WebSocket error:', event);
  setConnectionError({
    message: 'Connection error',
    timestamp: Date.now()
  });
};

socket.onclose = (event) => {
  setConnected(false);
  
  // Attempt reconnection
  if (!event.wasClean) {
    setTimeout(() => {
      reconnect();
    }, 2000);
  }
};
```

## Performance Considerations

### Message Broadcasting

- **Batch updates**: Debounce rapid message broadcasts
- **Selective broadcasting**: Only send to interested UI clients
- **Message size limits**: Truncate large payloads for UI display

### UI Rendering

- **Virtual scrolling**: For large message history
- **Message pagination**: Load messages in chunks
- **Debounced updates**: Batch UI state updates

## Testing Strategy

### Integration Points to Test

1. **MCP Protocol**: Tool calls, sampling, elicitation, notifications
2. **WebSocket Communication**: Message broadcasting, command handling
3. **Message Tracking**: Storage, retrieval, session management
4. **UI Components**: WebSocket client, forms, message display
5. **Multi-client**: Session isolation, client selection

See TESTING_STRATEGY.md for detailed test specifications.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Status**: Design Complete - Ready for Implementation