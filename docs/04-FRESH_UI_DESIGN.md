# Fresh UI Design - Detailed Implementation

## Overview

This document provides detailed implementation specifications for the Fresh UI
console component. The UI is built with Deno Fresh, providing a modern,
interactive web interface for testing MCP clients.

## Project Structure

```
fresh-ui/
├── main.ts                          # Entry point
├── dev.ts                           # Development server
├── deno.json                        # Deno configuration
├── fresh.config.ts                  # Fresh configuration
├── routes/
│   ├── index.tsx                    # Main console UI
│   ├── _404.tsx                     # Not found page
│   └── _app.tsx                     # App wrapper
├── islands/
│   ├── ConnectionStatus.tsx         # Connection status indicator
│   ├── ClientSelector.tsx           # Multi-client selector
│   ├── SamplingForm.tsx             # Sampling request builder
│   ├── ElicitationForm.tsx          # Elicitation request builder
│   ├── NotificationTrigger.tsx      # Notification trigger controls
│   └── MessageViewer.tsx            # Protocol message viewer
├── components/
│   ├── Layout.tsx                   # Page layout
│   ├── Card.tsx                     # Card component
│   ├── Button.tsx                   # Button component
│   └── JsonDisplay.tsx              # JSON display component
├── hooks/
│   └── useWebSocket.ts              # WebSocket client hook
├── lib/
│   ├── websocket.ts                 # WebSocket utilities
│   └── formatters.ts                # Data formatters
└── static/
    └── styles.css                   # Additional styles
```

## Entry Points

### Main Entry (main.ts)

```typescript
#!/usr/bin/env -S deno run -A

import { start } from '$fresh/server.ts';
import manifest from './fresh.gen.ts';
import config from './fresh.config.ts';

await start(manifest, config);
```

### Development Server (dev.ts)

```typescript
#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from '$fresh/dev.ts';
import config from './fresh.config.ts';

import '$std/dotenv/load.ts';

await dev(import.meta.url, './main.ts', config);
```

### Fresh Configuration (fresh.config.ts)

```typescript
import { defineConfig } from '$fresh/server.ts';
import tailwind from '$fresh/plugins/tailwind.ts';

export default defineConfig({
  plugins: [tailwind()],
});
```

## Configuration

### deno.json

```json
{
  "name": "@beyondbetter/mcp-client-inspector-ui",
  "version": "1.0.0",
  "tasks": {
    "start": "deno run -A main.ts",
    "dev": "deno run -A --watch=static/,routes/ dev.ts",
    "build": "deno run -A dev.ts build",
    "preview": "deno run -A main.ts",
    "check": "deno check **/*.ts **/*.tsx",
    "lint": "deno lint",
    "fmt": "deno fmt"
  },
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@1.6.8/",
    "preact": "https://esm.sh/preact@10.19.6",
    "preact/": "https://esm.sh/preact@10.19.6/",
    "@preact/signals": "https://esm.sh/*@preact/signals@1.2.2",
    "@preact/signals-core": "https://esm.sh/*@preact/signals-core@1.5.1",
    "tailwindcss": "npm:tailwindcss@3.4.1",
    "tailwindcss/": "npm:/tailwindcss@3.4.1/",
    "tailwindcss/plugin": "npm:/tailwindcss@3.4.1/plugin.js"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

## WebSocket Hook

```typescript
// hooks/useWebSocket.ts

import { useEffect, useState } from 'preact/hooks';
import { Signal, signal } from '@preact/signals';

export interface ConsoleMessage {
  type: string;
  payload: unknown;
}

export interface ConsoleCommand {
  type: string;
  payload?: unknown;
}

export interface WebSocketState {
  connected: boolean;
  messages: ConsoleMessage[];
  error: string | null;
  connectionId: string | null;
}

export function useWebSocket(url: string) {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    messages: [],
    error: null,
    connectionId: null,
  });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Connect to WebSocket
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: number | null = null;

    const connect = () => {
      try {
        socket = new WebSocket(url);

        socket.onopen = () => {
          console.log('WebSocket connected');
          setState((prev) => ({
            ...prev,
            connected: true,
            error: null,
          }));
          setWs(socket);
          setReconnectAttempts(0);
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as ConsoleMessage;

            // Handle connection established message
            if (message.type === 'connection_established') {
              setState((prev) => ({
                ...prev,
                connectionId: (message.payload as { connectionId: string }).connectionId,
              }));
            }

            setState((prev) => ({
              ...prev,
              messages: [...prev.messages, message],
            }));
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        socket.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          setState((prev) => ({
            ...prev,
            connected: false,
          }));
          setWs(null);

          // Attempt reconnection with exponential backoff
          if (!event.wasClean) {
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts),
              30000,
            );
            console.log(`Reconnecting in ${delay}ms...`);

            reconnectTimeout = setTimeout(() => {
              setReconnectAttempts((prev) => prev + 1);
              connect();
            }, delay);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setState((prev) => ({
            ...prev,
            error: 'WebSocket connection error',
          }));
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        setState((prev) => ({
          ...prev,
          error: 'Failed to create WebSocket connection',
        }));
      }
    };

    connect();

    // Cleanup
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [url]);

  // Send command to server
  const sendCommand = (command: ConsoleCommand) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(command));
      } catch (error) {
        console.error('Error sending command:', error);
        setState((prev) => ({
          ...prev,
          error: 'Failed to send command',
        }));
      }
    } else {
      console.warn('WebSocket not connected');
      setState((prev) => ({
        ...prev,
        error: 'Not connected to server',
      }));
    }
  };

  // Clear messages
  const clearMessages = () => {
    setState((prev) => ({
      ...prev,
      messages: [],
    }));
  };

  return {
    ...state,
    sendCommand,
    clearMessages,
  };
}
```

## Routes

### Main Console Route (routes/index.tsx)

```typescript
import { PageProps } from '$fresh/server.ts';
import { Head } from '$fresh/runtime.ts';
import ConnectionStatus from '../islands/ConnectionStatus.tsx';
import ClientSelector from '../islands/ClientSelector.tsx';
import SamplingForm from '../islands/SamplingForm.tsx';
import ElicitationForm from '../islands/ElicitationForm.tsx';
import NotificationTrigger from '../islands/NotificationTrigger.tsx';
import MessageViewer from '../islands/MessageViewer.tsx';

export default function Console(props: PageProps) {
  const wsUrl = Deno.env.get('MCP_SERVER_WS_URL') ||
    'ws://localhost:3000/ws/console';

  return (
    <>
      <Head>
        <title>MCP Client Inspector</title>
        <meta
          name='description'
          content='Test and inspect MCP client implementations'
        />
      </Head>

      <div class='min-h-screen bg-gray-50'>
        {/* Header */}
        <header class='bg-white shadow-sm border-b border-gray-200'>
          <div class='container mx-auto px-4 py-4'>
            <div class='flex items-center justify-between'>
              <div>
                <h1 class='text-3xl font-bold text-gray-900'>
                  🔍 MCP Client Inspector
                </h1>
                <p class='text-sm text-gray-600 mt-1'>
                  Test sampling, elicitation, and notifications
                </p>
              </div>
              <ConnectionStatus wsUrl={wsUrl} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main class='container mx-auto px-4 py-6'>
          <div class='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            {/* Message Viewer - Left Side */}
            <div class='lg:col-span-8'>
              <MessageViewer wsUrl={wsUrl} />
            </div>

            {/* Controls - Right Side */}
            <div class='lg:col-span-4 space-y-6'>
              <ClientSelector wsUrl={wsUrl} />
              <SamplingForm wsUrl={wsUrl} />
              <ElicitationForm wsUrl={wsUrl} />
              <NotificationTrigger wsUrl={wsUrl} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer class='bg-white border-t border-gray-200 mt-12'>
          <div class='container mx-auto px-4 py-4'>
            <p class='text-center text-sm text-gray-600'>
              MCP Client Inspector v1.0.0 | Beyond Better
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
```

## Islands (Interactive Components)

### Connection Status Island

```typescript
// islands/ConnectionStatus.tsx

import { useWebSocket } from '../hooks/useWebSocket.ts';

interface ConnectionStatusProps {
  wsUrl: string;
}

export default function ConnectionStatus({ wsUrl }: ConnectionStatusProps) {
  const { connected, error, connectionId } = useWebSocket(wsUrl);

  return (
    <div class='flex items-center gap-3'>
      {/* Status Indicator */}
      <div class='flex items-center gap-2'>
        <div
          class={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
        />
        <span class='text-sm font-medium text-gray-700'>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Connection ID */}
      {connectionId && (
        <span class='text-xs text-gray-500 font-mono'>
          ID: {connectionId.slice(0, 8)}
        </span>
      )}

      {/* Error Message */}
      {error && <span class='text-xs text-red-600'>{error}</span>}
    </div>
  );
}
```

### Client Selector Island

```typescript
// islands/ClientSelector.tsx

import { useEffect, useState } from 'preact/hooks';
import { useWebSocket } from '../hooks/useWebSocket.ts';

interface ClientSelectorProps {
  wsUrl: string;
}

interface ClientInfo {
  id: string;
  name: string;
  transport: string;
  connected: boolean;
  lastSeen: number;
}

export default function ClientSelector({ wsUrl }: ClientSelectorProps) {
  const { messages, sendCommand, connected } = useWebSocket(wsUrl);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Update clients from messages
  useEffect(() => {
    const clientListMessage = messages.find((m) => m.type === 'client_list');
    if (clientListMessage) {
      const payload = clientListMessage.payload as { clients: ClientInfo[] };
      setClients(payload.clients);

      // Auto-select first client if none selected
      if (!selectedClient && payload.clients.length > 0) {
        setSelectedClient(payload.clients[0].id);
      }
    }
  }, [messages]);

  // Request client list on mount
  useEffect(() => {
    if (connected) {
      sendCommand({ type: 'get_clients' });
    }
  }, [connected]);

  return (
    <div class='bg-white rounded-lg shadow p-4'>
      <h2 class='text-lg font-semibold text-gray-900 mb-3'>
        📱 Connected Clients
      </h2>

      {clients.length === 0
        ? (
          <p class='text-sm text-gray-500'>
            No clients connected. Start an MCP client and connect to the server.
          </p>
        )
        : (
          <div class='space-y-2'>
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                class={`w-full text-left p-3 rounded border transition-colors ${
                  selectedClient === client.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div class='flex items-center justify-between'>
                  <div>
                    <div class='font-medium text-sm text-gray-900'>
                      {client.name}
                    </div>
                    <div class='text-xs text-gray-500'>
                      {client.transport} • {client.id.slice(0, 8)}
                    </div>
                  </div>
                  <div
                    class={`w-2 h-2 rounded-full ${
                      client.connected ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        )}

      <button
        onClick={() => sendCommand({ type: 'get_clients' })}
        class='mt-3 w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors'
      >
        🔄 Refresh
      </button>
    </div>
  );
}
```

### Sampling Form Island

```typescript
// islands/SamplingForm.tsx

import { useState } from 'preact/hooks';
import { useWebSocket } from '../hooks/useWebSocket.ts';

interface SamplingFormProps {
  wsUrl: string;
}

export default function SamplingForm({ wsUrl }: SamplingFormProps) {
  const { sendCommand, connected } = useWebSocket(wsUrl);
  const [message, setMessage] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [jsonInput, setJsonInput] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (jsonInput) {
      // Use JSON input
      try {
        const payload = JSON.parse(jsonText);
        sendCommand({
          type: 'request_sampling',
          payload,
        });
      } catch (error) {
        alert('Invalid JSON: ' + error.message);
      }
    } else {
      // Use form inputs
      sendCommand({
        type: 'request_sampling',
        payload: {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: message,
              },
            },
          ],
          modelPreferences: model
            ? {
              hints: [{ name: model }],
            }
            : undefined,
          maxTokens,
          temperature,
        },
      });
    }
  };

  return (
    <div class='bg-white rounded-lg shadow p-4'>
      <h2 class='text-lg font-semibold text-gray-900 mb-3'>
        🧠 Sampling Request
      </h2>

      <form onSubmit={handleSubmit} class='space-y-3'>
        {/* Input Mode Toggle */}
        <div class='flex items-center gap-2 text-sm'>
          <label class='flex items-center gap-1 cursor-pointer'>
            <input
              type='checkbox'
              checked={jsonInput}
              onChange={(e) => setJsonInput((e.target as HTMLInputElement).checked)}
              class='rounded'
            />
            <span>JSON input</span>
          </label>
        </div>

        {jsonInput
          ? (
            <div>
              <label class='block text-sm font-medium text-gray-700 mb-1'>
                JSON Payload
              </label>
              <textarea
                value={jsonText}
                onInput={(e) => setJsonText((e.target as HTMLTextAreaElement).value)}
                placeholder='{"messages": [{"role": "user", "content": {...}}], ...}'
                class='w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs'
                rows={8}
              />
            </div>
          )
          : (
            <>
              <div>
                <label class='block text-sm font-medium text-gray-700 mb-1'>
                  Message
                </label>
                <textarea
                  value={message}
                  onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
                  placeholder='Enter message for sampling...'
                  class='w-full px-3 py-2 border border-gray-300 rounded-lg'
                  rows={3}
                  required
                />
              </div>

              <div>
                <label class='block text-sm font-medium text-gray-700 mb-1'>
                  Model (optional)
                </label>
                <input
                  type='text'
                  value={model}
                  onInput={(e) => setModel((e.target as HTMLInputElement).value)}
                  placeholder='e.g., gpt-4, claude-3'
                  class='w-full px-3 py-2 border border-gray-300 rounded-lg'
                />
              </div>

              <div class='grid grid-cols-2 gap-3'>
                <div>
                  <label class='block text-sm font-medium text-gray-700 mb-1'>
                    Temperature
                  </label>
                  <input
                    type='number'
                    value={temperature}
                    onInput={(e) =>
                      setTemperature(
                        parseFloat((e.target as HTMLInputElement).value),
                      )}
                    min='0'
                    max='2'
                    step='0.1'
                    class='w-full px-3 py-2 border border-gray-300 rounded-lg'
                  />
                </div>

                <div>
                  <label class='block text-sm font-medium text-gray-700 mb-1'>
                    Max Tokens
                  </label>
                  <input
                    type='number'
                    value={maxTokens}
                    onInput={(e) =>
                      setMaxTokens(
                        parseInt((e.target as HTMLInputElement).value),
                      )}
                    min='1'
                    max='4096'
                    class='w-full px-3 py-2 border border-gray-300 rounded-lg'
                  />
                </div>
              </div>
            </>
          )}

        <button
          type='submit'
          disabled={!connected || (!jsonInput && !message)}
          class='w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors'
        >
          Send Sampling Request
        </button>
      </form>
    </div>
  );
}
```

### Elicitation Form Island

```typescript
// islands/ElicitationForm.tsx

import { useState } from 'preact/hooks';
import { useWebSocket } from '../hooks/useWebSocket.ts';

interface ElicitationFormProps {
  wsUrl: string;
}

export default function ElicitationForm({ wsUrl }: ElicitationFormProps) {
  const { sendCommand, connected } = useWebSocket(wsUrl);
  const [message, setMessage] = useState('');
  const [schema, setSchema] = useState('');
  const [useSchema, setUseSchema] = useState(false);

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const payload: {
      message: string;
      requestedSchema?: unknown;
    } = {
      message,
    };

    if (useSchema && schema) {
      try {
        payload.requestedSchema = JSON.parse(schema);
      } catch (error) {
        alert('Invalid schema JSON: ' + error.message);
        return;
      }
    }

    sendCommand({
      type: 'request_elicitation',
      payload,
    });
  };

  return (
    <div class='bg-white rounded-lg shadow p-4'>
      <h2 class='text-lg font-semibold text-gray-900 mb-3'>
        ❓ Elicitation Request
      </h2>

      <form onSubmit={handleSubmit} class='space-y-3'>
        <div>
          <label class='block text-sm font-medium text-gray-700 mb-1'>
            Message
          </label>
          <textarea
            value={message}
            onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
            placeholder='Enter message for elicitation...'
            class='w-full px-3 py-2 border border-gray-300 rounded-lg'
            rows={3}
            required
          />
        </div>

        <div class='flex items-center gap-2 text-sm'>
          <label class='flex items-center gap-1 cursor-pointer'>
            <input
              type='checkbox'
              checked={useSchema}
              onChange={(e) => setUseSchema((e.target as HTMLInputElement).checked)}
              class='rounded'
            />
            <span>Include schema</span>
          </label>
        </div>

        {useSchema && (
          <div>
            <label class='block text-sm font-medium text-gray-700 mb-1'>
              Schema (JSON)
            </label>
            <textarea
              value={schema}
              onInput={(e) => setSchema((e.target as HTMLTextAreaElement).value)}
              placeholder='{"type": "object", "properties": {...}}'
              class='w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs'
              rows={5}
            />
          </div>
        )}

        <button
          type='submit'
          disabled={!connected || !message}
          class='w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors'
        >
          Send Elicitation Request
        </button>
      </form>
    </div>
  );
}
```

### Notification Trigger Island

```typescript
// islands/NotificationTrigger.tsx

import { useState } from 'preact/hooks';
import { useWebSocket } from '../hooks/useWebSocket.ts';

interface NotificationTriggerProps {
  wsUrl: string;
}

export default function NotificationTrigger(
  { wsUrl }: NotificationTriggerProps,
) {
  const { sendCommand, connected } = useWebSocket(wsUrl);

  const triggerNotification = (method: string) => {
    sendCommand({
      type: 'trigger_notification',
      payload: {
        method,
        params: {},
      },
    });
  };

  return (
    <div class='bg-white rounded-lg shadow p-4'>
      <h2 class='text-lg font-semibold text-gray-900 mb-3'>
        🔔 Trigger Notifications
      </h2>

      <div class='space-y-2'>
        <button
          onClick={() => triggerNotification('notifications/tools/list_changed')}
          disabled={!connected}
          class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm rounded-lg font-medium transition-colors text-left'
        >
          🛠️ Tools List Changed
        </button>

        <button
          onClick={() => triggerNotification('notifications/resources/list_changed')}
          disabled={!connected}
          class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm rounded-lg font-medium transition-colors text-left'
        >
          📎 Resources List Changed
        </button>

        <button
          onClick={() => triggerNotification('notifications/prompts/list_changed')}
          disabled={!connected}
          class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm rounded-lg font-medium transition-colors text-left'
        >
          📝 Prompts List Changed
        </button>
      </div>

      <p class='text-xs text-gray-500 mt-3'>
        Triggers notifications to connected MCP clients
      </p>
    </div>
  );
}
```

### Message Viewer Island

```typescript
// islands/MessageViewer.tsx

import { useEffect, useRef, useState } from 'preact/hooks';
import { useWebSocket } from '../hooks/useWebSocket.ts';

interface MessageViewerProps {
  wsUrl: string;
}

export default function MessageViewer({ wsUrl }: MessageViewerProps) {
  const { messages, clearMessages, connected } = useWebSocket(wsUrl);
  const [filter, setFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    if (filter === 'all') return true;
    if (filter === 'mcp') {
      return msg.type === 'mcp_message' ||
        msg.type === 'tool_call' ||
        msg.type === 'sampling_response' ||
        msg.type === 'elicitation_response';
    }
    if (filter === 'sampling') {
      return msg.type === 'sampling_response' ||
        msg.type === 'sampling_error';
    }
    if (filter === 'elicitation') {
      return msg.type === 'elicitation_response' ||
        msg.type === 'elicitation_error';
    }
    if (filter === 'notifications') {
      return msg.type === 'notification_sent';
    }
    return true;
  });

  const getMessageTypeColor = (type: string): string => {
    if (type.includes('error')) return 'bg-red-100 text-red-800';
    if (type.includes('sampling')) return 'bg-blue-100 text-blue-800';
    if (type.includes('elicitation')) return 'bg-purple-100 text-purple-800';
    if (type.includes('notification')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div class='bg-white rounded-lg shadow'>
      {/* Header */}
      <div class='border-b border-gray-200 p-4'>
        <div class='flex items-center justify-between'>
          <h2 class='text-lg font-semibold text-gray-900'>
            💬 Protocol Messages
          </h2>
          <div class='flex items-center gap-2'>
            <select
              value={filter}
              onChange={(e) => setFilter((e.target as HTMLSelectElement).value)}
              class='px-3 py-1 border border-gray-300 rounded text-sm'
            >
              <option value='all'>All Messages</option>
              <option value='mcp'>MCP Protocol</option>
              <option value='sampling'>Sampling</option>
              <option value='elicitation'>Elicitation</option>
              <option value='notifications'>Notifications</option>
            </select>
            <button
              onClick={clearMessages}
              class='px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors'
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div class='h-[600px] overflow-y-auto p-4 space-y-2'>
        {filteredMessages.length === 0
          ? (
            <div class='flex items-center justify-center h-full text-gray-500'>
              <div class='text-center'>
                <p class='text-lg mb-2'>📡</p>
                <p>No messages yet</p>
                <p class='text-sm mt-1'>
                  {connected ? 'Waiting for activity...' : 'Connect to server to start'}
                </p>
              </div>
            </div>
          )
          : (
            filteredMessages.map((msg, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedMessage(selectedMessage === idx ? null : idx)}
                class='border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-300 transition-colors'
              >
                <div class='flex items-center justify-between mb-2'>
                  <span
                    class={`px-2 py-1 rounded text-xs font-medium ${getMessageTypeColor(msg.type)}`}
                  >
                    {msg.type}
                  </span>
                  <span class='text-xs text-gray-500'>
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>

                {selectedMessage === idx
                  ? (
                    <pre class='text-xs font-mono bg-gray-50 p-2 rounded overflow-x-auto'>
                  {JSON.stringify(msg.payload, null, 2)}
                    </pre>
                  )
                  : (
                    <div class='text-sm text-gray-600 truncate'>
                      {JSON.stringify(msg.payload).substring(0, 100)}...
                    </div>
                  )}
              </div>
            ))
          )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
```

## Styling

### Tailwind Configuration

Fresh includes Tailwind CSS by default. The configuration is in
`tailwind.config.ts`:

```typescript
import { type Config } from 'tailwindcss';

export default {
  content: [
    '{routes,islands,components}/**/*.{ts,tsx}',
  ],
} satisfies Config;
```

### Additional Styles (static/styles.css)

```css
/* Custom scrollbar for message viewer */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## Environment Configuration

### .env.example

```bash
# WebSocket Connection
MCP_SERVER_WS_URL=ws://localhost:3000/ws/console

# UI Configuration
PORT=8000
```

---

**Document Version**: 1.0 **Last Updated**: 2025-10-22 **Status**: Design
Complete - Ready for Implementation
