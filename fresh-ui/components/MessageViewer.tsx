/**
 * Message Viewer Component
 *
 * Displays protocol messages with filtering, expansion, and type-based styling.
 * Uses DaisyUI card, badge, and select components.
 */

import { clearMessages, wsConnected, wsMessages } from '../hooks/useWebSocket.ts';
import { messageFilter, selectedMessage } from '../hooks/useConsoleState.ts';
import type { ConsoleMessage } from '@shared/types/index.ts';
import {
  isElicitationError,
  isElicitationResponse,
  isNotificationSent,
  isSamplingError,
  isSamplingResponse,
} from '@shared/types/index.ts';

export default function MessageViewer() {
  // Filter messages based on current filter using type guards
  const filteredMessages = wsMessages.value.filter((msg: ConsoleMessage) => {
    if (messageFilter.value === 'all') return true;
    if (messageFilter.value === 'mcp') {
      return msg.type === 'mcp_message' ||
        msg.type === 'tool_call' ||
        isSamplingResponse(msg) ||
        isElicitationResponse(msg);
    }
    if (messageFilter.value === 'sampling') {
      return isSamplingResponse(msg) || isSamplingError(msg);
    }
    if (messageFilter.value === 'elicitation') {
      return isElicitationResponse(msg) || isElicitationError(msg);
    }
    if (messageFilter.value === 'notifications') {
      return isNotificationSent(msg);
    }
    return true;
  });

  const getMessageTypeColor = (type: string): string => {
    if (type.includes('error')) return 'badge-error';
    if (type.includes('sampling')) return 'badge-info';
    if (type.includes('elicitation')) return 'badge-secondary';
    if (type.includes('notification')) return 'badge-success';
    return 'badge-ghost';
  };

  return (
    <div class='card bg-base-100 shadow-xl'>
      {/* Header */}
      <div class='card-body'>
        <div class='flex items-center justify-between mb-4'>
          <h2 class='card-title'>💬 Protocol Messages</h2>
          <div class='flex items-center gap-2'>
            <select
              value={messageFilter.value}
              onChange={(
                e,
              ) => (messageFilter.value = (e.target as HTMLSelectElement).value)}
              class='select select-bordered select-sm'
            >
              <option value='all'>All Messages</option>
              <option value='mcp'>MCP Protocol</option>
              <option value='sampling'>Sampling</option>
              <option value='elicitation'>Elicitation</option>
              <option value='notifications'>Notifications</option>
            </select>
            <button
              type='button'
              onClick={clearMessages}
              class='btn btn-sm btn-ghost'
            >
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div class='h-[600px] overflow-y-auto space-y-2'>
          {filteredMessages.length === 0
            ? (
              <div class='flex items-center justify-center h-full'>
                <div class='text-center'>
                  <p class='text-4xl mb-2'>📡</p>
                  <p class='text-base-content'>No messages yet</p>
                  <p class='text-sm text-base-content/60 mt-1'>
                    {wsConnected.value ? 'Waiting for activity...' : 'Connect to server to start'}
                  </p>
                </div>
              </div>
            )
            : (
              filteredMessages.map((msg, idx) => (
                <div
                  key={idx}
                  onClick={() => selectedMessage.value = selectedMessage.value === idx ? null : idx}
                  class='card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors'
                >
                  <div class='card-body p-3'>
                    <div class='flex items-center justify-between mb-2'>
                      <div class={`badge ${getMessageTypeColor(msg.type)}`}>
                        {msg.type}
                      </div>
                      <span class='text-xs opacity-60'>
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString()
                          : new Date().toLocaleTimeString()}
                      </span>
                    </div>

                    {selectedMessage.value === idx
                      ? (
                        <pre class='text-xs font-mono bg-base-100 p-2 rounded overflow-x-auto'>
                          {JSON.stringify(msg.payload, null, 2)}
                        </pre>
                      )
                      : (
                        <div class='text-sm truncate opacity-80'>
                          {JSON.stringify(msg.payload).substring(0, 100)}...
                        </div>
                      )}
                  </div>
                </div>
              ))
            )}
        </div>
      </div>
    </div>
  );
}
