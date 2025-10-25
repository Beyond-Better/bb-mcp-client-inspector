/**
 * Stats Panel Component
 *
 * Displays console statistics including message counts and connection status.
 * Uses DaisyUI card and stats components.
 */

import { wsConnected, wsMessages } from '../hooks/useWebSocket.ts';
import { messageFilter } from '../hooks/useConsoleState.ts';

export default function StatsPanel() {
  // Calculate filtered message count
  const filteredMessages = wsMessages.value.filter((msg) => {
    if (messageFilter.value === 'all') return true;
    if (messageFilter.value === 'mcp') {
      return msg.type === 'mcp_message' ||
        msg.type === 'tool_call' ||
        msg.type === 'sampling_response' ||
        msg.type === 'elicitation_response';
    }
    if (messageFilter.value === 'sampling') {
      return msg.type === 'sampling_response' || msg.type === 'sampling_error';
    }
    if (messageFilter.value === 'elicitation') {
      return msg.type === 'elicitation_response' ||
        msg.type === 'elicitation_error';
    }
    if (messageFilter.value === 'notifications') {
      return msg.type === 'notification_sent';
    }
    return true;
  });

  return (
    <div class='card bg-base-100 shadow-xl'>
      <div class='card-body'>
        <h3 class='card-title text-sm'>📊 Statistics</h3>

        <div class='stats stats-vertical shadow'>
          <div class='stat'>
            <div class='stat-title'>Total Messages</div>
            <div class='stat-value text-2xl'>{wsMessages.value.length}</div>
          </div>

          <div class='stat'>
            <div class='stat-title'>Filtered</div>
            <div class='stat-value text-2xl'>{filteredMessages.length}</div>
          </div>

          <div class='stat'>
            <div class='stat-title'>Status</div>
            <div
              class={`stat-value text-2xl ${wsConnected.value ? 'text-success' : 'text-error'}`}
            >
              {wsConnected.value ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
