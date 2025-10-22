# WebSocket Console Endpoint

## Overview

The MCP Client Inspector provides a WebSocket endpoint at `/ws/console` for real-time communication with the Fresh UI console. This enables live monitoring of MCP protocol messages and interactive testing capabilities.

## Endpoint

**URL**: `ws://localhost:3000/ws/console` (HTTP mode only)

**Protocol**: WebSocket

## Connection

### Establishing Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/console');

ws.onopen = () => {
  console.log('Connected to MCP Inspector');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Connection Established Message

Upon successful connection, the server sends:

```json
{
  "type": "connection_established",
  "payload": {
    "connectionId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": 1729584000000,
    "serverVersion": "1.0.0"
  }
}
```

## Message Format

### Server-to-Console Messages

All messages from server follow this structure:

```typescript
interface ConsoleMessage {
  type: string;           // Message type identifier
  payload: unknown;       // Type-specific data
  timestamp?: number;     // Unix timestamp (ms)
}
```

### Console-to-Server Commands

All commands from console follow this structure:

```typescript
interface ConsoleCommand {
  type: string;           // Command type identifier
  payload: unknown;       // Type-specific parameters
}
```

## Available Commands

### 1. Get Clients

Request list of connected MCP clients.

**Request:**
```json
{
  "type": "get_clients",
  "payload": {}
}
```

**Response:**
```json
{
  "type": "client_list",
  "payload": {
    "clients": [
      {
        "clientId": "client-123",
        "sessionId": "session-456",
        "connectedAt": 1729584000000,
        "lastSeen": 1729584100000,
        "transport": "http"
      }
    ]
  },
  "timestamp": 1729584100000
}
```

### 2. Get Message History

Request message history for a session.

**Request:**
```json
{
  "type": "get_message_history",
  "payload": {
    "sessionId": "session-456",
    "limit": 100
  }
}
```

**Response:**
```json
{
  "type": "message_history",
  "payload": {
    "messages": [
      {
        "id": "msg-789",
        "timestamp": 1729584000000,
        "sessionId": "session-456",
        "direction": "incoming",
        "message": {
          "jsonrpc": "2.0",
          "method": "tools/call",
          "params": { /* ... */ }
        }
      }
    ]
  },
  "timestamp": 1729584100000
}
```

### 3. Trigger Notification

Send a notification to all connected MCP clients.

**Request:**
```json
{
  "type": "trigger_notification",
  "payload": {
    "method": "notifications/resources/list_changed",
    "params": {}
  }
}
```

**Response (Success):**
```json
{
  "type": "notification_sent",
  "payload": {
    "method": "notifications/resources/list_changed",
    "params": {},
    "timestamp": 1729584100000
  }
}
```

**Response (Error):**
```json
{
  "type": "notification_error",
  "payload": {
    "message": "Failed to send notification",
    "error": "No clients connected"
  }
}
```

### 4. Request Sampling

Request the MCP client to perform sampling (LLM completion).

**Request:**
```json
{
  "type": "request_sampling",
  "payload": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "What is 2+2?"
        }
      }
    ],
    "maxTokens": 100,
    "temperature": 0.7
  }
}
```

**Response (Success):**
```json
{
  "type": "sampling_response",
  "payload": {
    "model": "claude-3-opus",
    "stopReason": "end_turn",
    "role": "assistant",
    "content": {
      "type": "text",
      "text": "2+2 equals 4."
    }
  },
  "timestamp": 1729584100000
}
```

**Response (Error):**
```json
{
  "type": "sampling_error",
  "payload": {
    "message": "Sampling request failed",
    "error": "Client does not support sampling"
  },
  "timestamp": 1729584100000
}
```

### 5. Request Elicitation

Request user input from the MCP client.

**Request:**
```json
{
  "type": "request_elicitation",
  "payload": {
    "message": "Please provide your name",
    "requestedSchema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" }
      },
      "required": ["name"]
    }
  }
}
```

**Response (Success):**
```json
{
  "type": "elicitation_response",
  "payload": {
    "status": "accepted",
    "data": {
      "name": "John Doe"
    }
  },
  "timestamp": 1729584100000
}
```

**Response (Declined):**
```json
{
  "type": "elicitation_response",
  "payload": {
    "status": "declined"
  },
  "timestamp": 1729584100000
}
```

**Response (Error):**
```json
{
  "type": "elicitation_error",
  "payload": {
    "message": "Elicitation request failed",
    "error": "Client does not support elicitation"
  },
  "timestamp": 1729584100000
}
```

## Broadcast Messages

The server broadcasts certain messages to all connected console clients:

### Client List Updates

Sent when clients connect or disconnect:
```json
{
  "type": "client_list",
  "payload": {
    "clients": [ /* ... */ ]
  },
  "timestamp": 1729584100000
}
```

### MCP Protocol Messages

Broadcast all MCP protocol messages for monitoring:
```json
{
  "type": "mcp_message",
  "payload": {
    "direction": "incoming",
    "message": {
      "jsonrpc": "2.0",
      "method": "tools/call",
      "params": { /* ... */ }
    }
  },
  "timestamp": 1729584100000
}
```

## Error Handling

### General Error Format

```json
{
  "type": "error",
  "payload": {
    "message": "Error description",
    "error": "Detailed error message"
  }
}
```

### Common Errors

1. **Unknown Command**
   - Sent when console sends unrecognized command type
   - Payload includes the unknown command type

2. **Invalid Payload**
   - Sent when command payload is malformed
   - Payload includes parsing error details

3. **Operation Failed**
   - Sent when requested operation cannot be completed
   - Payload includes specific failure reason

## Connection Management

### Heartbeat (Future)

Currently not implemented. Future versions may include:
- Periodic ping/pong messages
- Automatic reconnection on disconnect
- Connection timeout handling

### Multiple Connections

Multiple console clients can connect simultaneously:
- Each receives its own `connectionId`
- All receive broadcast messages
- Commands are processed independently

## Security Considerations

### Current Implementation (v1.0)

- No authentication required
- Suitable for local development only
- Should not be exposed to public networks

### Future Enhancements

- Token-based authentication
- Connection limits
- Rate limiting
- TLS/WSS support

## Testing

### Using wscat

```bash
# Install wscat
npm install -g wscat

# Connect to endpoint
wscat -c ws://localhost:3000/ws/console

# Send command
{"type":"get_clients","payload":{}}
```

### Using JavaScript

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/console');

ws.onopen = () => {
  // Request client list
  ws.send(JSON.stringify({
    type: 'get_clients',
    payload: {}
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message.type, message.payload);
};
```

## Next Steps

1. **Fresh UI Integration**: Connect the Fresh UI console to this endpoint
2. **Message Filtering**: Add client-side filtering for message types
3. **Real-time Monitoring**: Display live protocol messages
4. **Interactive Testing**: Build UI forms for sampling and elicitation

## See Also

- [WebSocket Protocol Specification](../docs/06-WEBSOCKET_PROTOCOL.md)
- [Console Types](./src/console/types.ts)
- [ConsoleManager Implementation](./src/console/ConsoleManager.ts)
