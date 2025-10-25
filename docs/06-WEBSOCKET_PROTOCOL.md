# WebSocket Protocol - Console Communication Specification

## Overview

This document specifies the WebSocket protocol used for communication between
the MCP Server and the Fresh UI console. The protocol enables real-time
bidirectional communication for testing and monitoring MCP client behavior.

## Connection Establishment

### Endpoint

```
ws://localhost:3000/ws/console
```

**Configuration**:

- Port: Configured via `HTTP_PORT` environment variable (default: 3000)
- Path: Configured via `CONSOLE_WS_PATH` environment variable (default:
  `/ws/console`)
- Protocol: WebSocket (RFC 6455)

### Connection Flow

```
Console UI                MCP Server
    |                         |
    |---WebSocket Upgrade--->|
    |                         |
    |<--101 Switching------->|
    |    Protocols           |
    |                         |
    |<--connection_--------->|
    |   established           |
    |                         |
```

### Connection Established Message

Upon successful connection, the server sends:

```json
{
  "type": "connection_established",
  "payload": {
    "connectionId": "uuid-v4",
    "timestamp": 1234567890000,
    "serverVersion": "1.0.0"
  }
}
```

**Fields**:

- `connectionId`: Unique identifier for this console connection
- `timestamp`: Server timestamp (milliseconds since epoch)
- `serverVersion`: MCP Server version string

## Message Format

### General Structure

All messages are JSON-encoded with this structure:

```typescript
interface Message {
  type: string; // Message type identifier
  payload: unknown; // Type-specific payload
  timestamp?: number; // Optional timestamp
}
```

### Message Direction

**Server → Console** (ConsoleMessage):

- Connection status updates
- MCP protocol messages
- Client list updates
- Response to commands

**Console → Server** (ConsoleCommand):

- Request actions (sampling, elicitation)
- Trigger notifications
- Query information

## Server-to-Console Messages

### 1. Connection Established

**Type**: `connection_established`

**When**: Immediately after WebSocket connection

**Payload**:

```json
{
  "connectionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1698765432000,
  "serverVersion": "1.0.0"
}
```

### 2. Client List

**Type**: `client_list`

**When**:

- After connection (initial list)
- When clients connect/disconnect
- In response to `get_clients` command

**Payload**:

```json
{
  "clients": [
    {
      "id": "client-uuid",
      "name": "Test Client",
      "version": "1.0.0",
      "transport": "http",
      "connected": true,
      "lastSeen": 1698765432000,
      "sessionId": "session-uuid"
    }
  ]
}
```

**Fields**:

- `id`: Unique client identifier
- `name`: Client name (from initialize)
- `version`: Client version (optional)
- `transport`: Connection type ("stdio" | "http")
- `connected`: Connection status
- `lastSeen`: Last activity timestamp
- `sessionId`: Associated session ID (optional)

### 3. Message History

**Type**: `message_history`

**When**: In response to `get_message_history` command

**Payload**:

```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "timestamp": 1698765432000,
      "sessionId": "session-uuid",
      "direction": "incoming",
      "message": {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {...}
      }
    }
  ],
  "sessionId": "session-uuid",
  "hasMore": false
}
```

### 4. MCP Message

**Type**: `mcp_message`

**When**: MCP protocol message exchanged with client

**Payload**: The actual MCP JSON-RPC message

```json
{
  "direction": "incoming",
  "sessionId": "session-uuid",
  "message": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {
        "message": "test"
      }
    }
  }
}
```

### 5. Tool Call/Response

**Type**: `tool_call` | `tool_response`

**When**: Tool execution lifecycle

**Payload**:

```json
{
  "toolName": "echo",
  "arguments": {...},
  "result": {...},
  "duration": 123,
  "success": true
}
```

### 6. Sampling Response

**Type**: `sampling_response`

**When**: Client responds to sampling request

**Payload**:

```json
{
  "content": {
    "type": "text",
    "text": "Response from client"
  },
  "model": "gpt-4",
  "stopReason": "endTurn"
}
```

### 7. Sampling Error

**Type**: `sampling_error`

**When**: Sampling request fails

**Payload**:

```json
{
  "message": "Sampling request failed",
  "error": "Client does not support sampling",
  "code": "CAPABILITY_NOT_SUPPORTED"
}
```

### 8. Elicitation Response

**Type**: `elicitation_response`

**When**: Client responds to elicitation request

**Payload**:

```json
{
  "action": "accept",
  "content": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Actions**:

- `accept`: User provided input
- `decline`: User declined to provide input
- `cancel`: User cancelled the request

### 9. Elicitation Error

**Type**: `elicitation_error`

**When**: Elicitation request fails

**Payload**:

```json
{
  "message": "Elicitation request failed",
  "error": "Client does not support elicitation",
  "code": "CAPABILITY_NOT_SUPPORTED"
}
```

### 10. Notification Sent

**Type**: `notification_sent`

**When**: Notification successfully sent to clients

**Payload**:

```json
{
  "method": "notifications/tools/list_changed",
  "params": {},
  "timestamp": 1698765432000,
  "clientCount": 2
}
```

### 11. Error

**Type**: `error`

**When**: Error occurs in command processing

**Payload**:

```json
{
  "message": "Failed to process command",
  "error": "Invalid payload format",
  "code": "INVALID_COMMAND",
  "details": {...}
}
```

## Console-to-Server Commands

### 1. Trigger Notification

**Type**: `trigger_notification`

**Purpose**: Send notification to connected MCP clients

**Payload**:

```json
{
  "method": "notifications/tools/list_changed",
  "params": {}
}
```

**Supported Methods**:

- `notifications/tools/list_changed`
- `notifications/resources/list_changed`
- `notifications/prompts/list_changed`

**Response**: `notification_sent` or `error`

### 2. Request Sampling

**Type**: `request_sampling`

**Purpose**: Request LLM completion from client

**Payload**:

```json
{
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "What is 2+2?"
      }
    }
  ],
  "modelPreferences": {
    "hints": [
      { "name": "gpt-4" }
    ]
  },
  "maxTokens": 1000,
  "temperature": 0.7
}
```

**Response**: `sampling_response` or `sampling_error`

### 3. Request Elicitation

**Type**: `request_elicitation`

**Purpose**: Request user input from client

**Payload**:

```json
{
  "message": "Please provide your contact information",
  "requestedSchema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Your full name"
      },
      "email": {
        "type": "string",
        "description": "Your email address"
      }
    },
    "required": ["name", "email"]
  }
}
```

**Response**: `elicitation_response` or `elicitation_error`

### 4. Get Clients

**Type**: `get_clients`

**Purpose**: Request current client list

**Payload**: None (empty or omitted)

**Response**: `client_list`

### 5. Get Message History

**Type**: `get_message_history`

**Purpose**: Request message history for a session

**Payload**:

```json
{
  "sessionId": "session-uuid",
  "limit": 100
}
```

**Response**: `message_history`

## Message Examples

### Example 1: Complete Sampling Flow

**1. Console sends request:**

```json
{
  "type": "request_sampling",
  "payload": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Write a haiku about programming"
        }
      }
    ],
    "maxTokens": 100
  }
}
```

**2. Server broadcasts MCP message:**

```json
{
  "type": "mcp_message",
  "payload": {
    "direction": "outgoing",
    "message": {
      "jsonrpc": "2.0",
      "method": "sampling/createMessage",
      "params": {...}
    }
  }
}
```

**3. Server broadcasts client response:**

```json
{
  "type": "sampling_response",
  "payload": {
    "content": {
      "type": "text",
      "text": "Code flows like water\nBugs hide in the shadows deep\nDebug till sunrise"
    },
    "model": "gpt-4",
    "stopReason": "endTurn"
  }
}
```

### Example 2: Tool Call with Message Tracking

**1. Client calls tool (MCP message):**

```json
{
  "type": "mcp_message",
  "payload": {
    "direction": "incoming",
    "sessionId": "session-123",
    "message": {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "tools/call",
      "params": {
        "name": "echo",
        "arguments": {
          "message": "Hello, World!"
        }
      }
    }
  }
}
```

**2. Server executes and responds (MCP message):**

```json
{
  "type": "mcp_message",
  "payload": {
    "direction": "outgoing",
    "sessionId": "session-123",
    "message": {
      "jsonrpc": "2.0",
      "id": 1,
      "result": {
        "content": [
          {
            "type": "text",
            "text": "Hello, World!"
          }
        ]
      }
    }
  }
}
```

### Example 3: Notification Trigger

**1. Console triggers notification:**

```json
{
  "type": "trigger_notification",
  "payload": {
    "method": "notifications/tools/list_changed",
    "params": {}
  }
}
```

**2. Server confirms:**

```json
{
  "type": "notification_sent",
  "payload": {
    "method": "notifications/tools/list_changed",
    "params": {},
    "timestamp": 1698765432000,
    "clientCount": 2
  }
}
```

## Connection Management

### Heartbeat/Ping-Pong

**Purpose**: Keep connection alive and detect disconnections

**Interval**: 30 seconds (configurable)

**Implementation**:

```typescript
// Server sends ping
webSocket.ping();

// Client responds with pong (automatic in most browsers)
```

### Reconnection Strategy

**Console UI reconnection logic**:

1. **Detect disconnection**: `onclose` event
2. **Exponential backoff**: Delay = min(1000 * 2^attempts, 30000)
3. **Max attempts**: 10 (configurable)
4. **Reset on success**: Attempts reset to 0 on successful connection

**Flow**:

```
Disconnect → Wait (1s) → Retry
  ↓
Fail → Wait (2s) → Retry
  ↓
Fail → Wait (4s) → Retry
  ↓
... (up to 30s max delay)
```

### Error Handling

**Connection Errors**:

- Network unavailable
- Server unreachable
- Authentication failed (future)

**Protocol Errors**:

- Invalid JSON
- Unknown message type
- Invalid payload

**Recovery**:

- Display error to user
- Attempt reconnection
- Clear error on success

## Security Considerations

### Current Implementation (v1.0)

**No authentication**: WebSocket endpoint is publicly accessible

- Suitable for local development
- **NOT suitable for production**

### Future Enhancement (Roadmap)

**Token-based authentication**:

```
ws://localhost:3000/ws/console?token=<auth-token>
```

**Server validation**:

```typescript
const url = new URL(request.url);
const token = url.searchParams.get('token');

if (AUTH_ENABLED && !validateToken(token)) {
  return new Response('Unauthorized', { status: 401 });
}
```

## Performance Considerations

### Message Size Limits

- **Maximum message size**: 10MB
- **Recommended size**: < 1MB for responsive UI
- **Large payloads**: Consider pagination or truncation

### Message Rate Limiting

- **Broadcast throttling**: Debounce rapid updates (100ms)
- **Client protection**: Rate limit command processing
- **Buffer management**: Limit in-memory message buffer

### Scalability

**Current architecture**:

- Single server instance
- In-memory connection map
- Suitable for: Development, testing, small teams

**Future considerations**:

- Connection pooling
- Message queue (Redis)
- Horizontal scaling

## Testing

### Manual Testing

**Using wscat**:

```bash
# Connect
wscat -c ws://localhost:3000/ws/console

# Send command
{"type":"get_clients"}

# Receive messages
{"type":"client_list","payload":{...}}
```

### Automated Testing

```typescript
// WebSocket client test
const ws = new WebSocket('ws://localhost:3000/ws/console');

ws.onopen = () => {
  // Send test command
  ws.send(JSON.stringify({
    type: 'get_clients',
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  assert(message.type === 'client_list');
};
```

## Troubleshooting

### Common Issues

**1. Connection refused**

- Check server is running
- Verify port configuration
- Check firewall rules

**2. Messages not received**

- Check WebSocket connection status
- Verify message format
- Check browser console for errors

**3. Reconnection loops**

- Server may be rejecting connections
- Check server logs for errors
- Verify WebSocket upgrade handling

### Debug Logging

**Server side**:

```bash
LOG_LEVEL=debug deno task dev
```

**Client side**:

```typescript
// Enable debug logging
const debug = true;

if (debug) {
  console.log('WebSocket message:', message);
}
```

## Message Flow Diagrams

### Initialization Flow

```
Console               Server              MCP Client
  |                     |                      |
  |--Connect----------->|                      |
  |<-connection---------|                      |
  |  established        |                      |
  |                     |                      |
  |--get_clients------->|                      |
  |<-client_list--------|                      |
  |                     |                      |
```

### Sampling Flow

```
Console               Server              MCP Client
  |                     |                      |
  |--request_sampling-->|                      |
  |                     |--sampling/---------->|
  |                     |  createMessage       |
  |<-mcp_message--------|                      |
  | (outgoing)          |                      |
  |                     |<-response------------||
  |<-mcp_message--------|                      |
  | (incoming)          |                      |
  |<-sampling_response--|                      |
  |                     |                      |
```

### Notification Flow

```
Console               Server              MCP Client
  |                     |                      |
  |--trigger_---------->|                      |
  |  notification       |                      |
  |                     |--notifications/----->|
  |                     |  *list_changed       |
  |<-notification_------|                      |
  |  sent               |                      |
  |                     |                      |
```

---

**Document Version**: 1.0 **Last Updated**: 2025-10-22 **Status**: Design
Complete - Ready for Implementation
