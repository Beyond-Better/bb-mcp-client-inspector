/**
 * Connection Status Component
 *
 * Displays WebSocket connection status with indicator and connection ID.
 * Uses DaisyUI badge and indicator components.
 */

import { wsConnected, wsConnectionId, wsError } from '../hooks/useWebSocket.ts';

export default function ConnectionStatus() {
  return (
    <div class='flex items-center gap-3'>
      {/* Status Badge with Indicator */}
      <div class='badge badge-lg gap-2'>
        <div
          class={`w-3 h-3 rounded-full ${
            wsConnected.value ? 'bg-success' : 'bg-error'
          } animate-pulse`}
        />
        <span class='font-medium'>
          {wsConnected.value ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Connection ID */}
      {wsConnectionId.value && (
        <div class='badge badge-ghost badge-sm font-mono'>
          ID: {wsConnectionId.value.slice(0, 8)}
        </div>
      )}

      {/* Error Alert */}
      {wsError.value && (
        <div class='badge badge-error badge-sm'>
          {wsError.value}
        </div>
      )}
    </div>
  );
}
