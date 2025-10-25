/**
 * Console State Hook - Module-Scoped Signals
 *
 * Manages UI state for the console interface.
 * Module-level signals are shared across all components.
 */

import { signal } from '@preact/signals';
import type { NotificationLevel, SessionId } from '@shared/types/index.ts';

// Client selection state
export const selectedClientId = signal<SessionId | null>(null);

// Message viewer state
export const selectedMessage = signal<number | null>(null);
export const messageFilter = signal<string>('all');

// Notification form state
export const notificationLevel = signal<NotificationLevel>('info');
export const notificationLogger = signal<string>('test');
export const notificationMessage = signal<string>('Test notification');

// Command panel state
export const activeTab = signal<string>('notifications');

/**
 * Hook to access console state (optional convenience)
 * Components can access signals directly or use this hook
 */
export function useConsoleState() {
  return {
    // Client selection
    selectedClientId,

    // Message viewer
    selectedMessage,
    messageFilter,

    // Notification form
    notificationLevel,
    notificationLogger,
    notificationMessage,

    // Command panel
    activeTab,
  };
}
