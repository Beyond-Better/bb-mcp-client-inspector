/**
 * Notification Form Component
 *
 * Form for triggering log notifications to MCP clients.
 * Uses DaisyUI form controls (select, input, textarea, button).
 */

import { sendCommand, wsConnected } from '../hooks/useWebSocket.ts';
import {
  notificationLevel,
  notificationLogger,
  notificationMessage,
  selectedClientId,
} from '../hooks/useConsoleState.ts';
import type { NotificationLevel, NotificationPayload } from '@shared/types/index.ts';

export default function NotificationForm() {
  const triggerNotification = () => {
    const payload: NotificationPayload = {
      level: notificationLevel.value,
      logger: notificationLogger.value || undefined,
      data: notificationMessage.value,
      sessionId: selectedClientId.value || undefined, // Target specific client
    };

    sendCommand({
      type: 'trigger_notification',
      payload,
    });
  };

  return (
    <div class='space-y-4'>
      {/* Level Select */}
      <div class='form-control'>
        <label class='label'>
          <span class='label-text'>Level</span>
        </label>
        <select
          value={notificationLevel.value}
          onChange={(
            e,
          ) => (notificationLevel.value = (e.target as HTMLSelectElement)
            .value as NotificationLevel)}
          class='select select-bordered w-full'
        >
          <option value='debug'>Debug</option>
          <option value='info'>Info</option>
          <option value='notice'>Notice</option>
          <option value='warning'>Warning</option>
          <option value='error'>Error</option>
          <option value='critical'>Critical</option>
          <option value='alert'>Alert</option>
          <option value='emergency'>Emergency</option>
        </select>
      </div>

      {/* Logger Input */}
      <div class='form-control'>
        <label class='label'>
          <span class='label-text'>Logger (optional)</span>
        </label>
        <input
          type='text'
          value={notificationLogger.value}
          onInput={(
            e,
          ) => (notificationLogger.value = (e.target as HTMLInputElement).value)}
          placeholder='e.g., test, system'
          class='input input-bordered w-full'
        />
      </div>

      {/* Message Textarea */}
      <div class='form-control'>
        <label class='label'>
          <span class='label-text'>Message</span>
        </label>
        <textarea
          value={notificationMessage.value}
          onInput={(
            e,
          ) => (notificationMessage.value = (e.target as HTMLTextAreaElement)
            .value)}
          placeholder='Notification message...'
          class='textarea textarea-bordered w-full'
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <button
        type='button'
        onClick={triggerNotification}
        disabled={!wsConnected.value}
        class='btn btn-success w-full'
      >
        🔔 Send Notification
      </button>

      {/* Help Text */}
      <div class='alert alert-info'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          class='stroke-current shrink-0 w-6 h-6'
        >
          <path
            stroke-linecap='round'
            stroke-linejoin='round'
            stroke-width='2'
            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          >
          </path>
        </svg>
        <span class='text-sm'>
          Triggers log notification to connected MCP clients
        </span>
      </div>
    </div>
  );
}
