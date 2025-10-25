/**
 * Client Selector Component
 *
 * Displays and manages selection of connected MCP clients.
 * Updates when client_list messages are received via WebSocket.
 */

import { useEffect, useRef } from 'preact/hooks';
import { sendCommand, wsMessages } from '../hooks/useWebSocket.ts';
import { selectedClientId } from '../hooks/useConsoleState.ts';
import type { ClientInfo, SessionId } from '@shared/types/index.ts';
import { isClientList } from '@shared/types/index.ts';

export default function ClientSelector() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  // Extract clients from messages
  const clientListMessage = wsMessages.value.find(isClientList);
  const clients = clientListMessage
    ? (clientListMessage.payload as { clients: ClientInfo[] }).clients
    : [];

  // Auto-select first client if none selected and clients available
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId.value) {
      selectedClientId.value = clients[0].sessionId;
    }
  }, [clients.length]);

  // Request client list on mount
  useEffect(() => {
    sendCommand({ type: 'get_clients' });
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      if (detailsRef.current && detailsRef.current.open) {
        // Check if click is on the summary or dropdown content
        const clickedSummary = summaryRef.current?.contains(target);
        const clickedContent = dropdownContentRef.current?.contains(target);

        // Close if clicked outside both summary and content
        if (!clickedSummary && !clickedContent) {
          detailsRef.current.open = false;
        }
      }
    };

    // Use capture phase to catch events before they're stopped
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  const handleRefresh = () => {
    sendCommand({ type: 'get_clients' });
  };

  const handleSelectClient = (sessionId: SessionId) => {
    selectedClientId.value = sessionId;
    // Close the dropdown
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  // Get selected client for display in trigger button
  const selectedClient = clients.find((c) => c.sessionId === selectedClientId.value);
  // deno-lint-ignore no-explicit-any
  const selectedMetadata = selectedClient?.metadata as any;
  const selectedClientName = selectedMetadata?.clientInfo?.name ||
    selectedClient?.sessionId;

  return (
    <div class='card bg-base-100 shadow-xl'>
      <div class='card-body'>
        {/* Header with Refresh Button */}
        <div class='flex items-center justify-between'>
          <h2 class='card-title'>📱 Connected Clients</h2>
          <button
            type='button'
            onClick={handleRefresh}
            class='btn btn-sm btn-ghost'
          >
            🔄 Refresh
          </button>
        </div>

        {clients.length === 0
          ? (
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
                />
              </svg>
              <span>
                No clients connected. Start an MCP client and connect to the server.
              </span>
            </div>
          )
          : (
            <details ref={detailsRef} class='dropdown dropdown-bottom w-full'>
              <summary
                ref={summaryRef}
                class='btn btn-soft w-full justify-between'
              >
                {selectedClient
                  ? (
                    <div class='flex items-center gap-2 truncate'>
                      <span class='truncate'>{selectedClientName}</span>
                      <span
                        class={`badge badge-sm ${
                          selectedClient.transport === 'stdio' ? 'badge-info' : 'badge-success'
                        }`}
                      >
                        {selectedClient.transport.toUpperCase()}
                      </span>
                    </div>
                  )
                  : <span class='text-base-content/70'>Select a client</span>}
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  class='h-4 w-4 ml-2 flex-shrink-0'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    stroke-width='2'
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </summary>

              <div
                ref={dropdownContentRef}
                class='dropdown-content z-[1] mt-2 w-full max-h-96 overflow-y-auto'
              >
                <ul class='menu bg-base-100 rounded-box shadow-xl border border-base-300 p-2 w-full'>
                  {clients.map((client) => {
                    const isSelected = selectedClientId.value === client.sessionId;
                    // deno-lint-ignore no-explicit-any
                    const metadata = client.metadata as any;
                    const clientName = metadata?.clientInfo?.name ||
                      client.sessionId;
                    const clientVersion = metadata?.clientInfo?.version;
                    const requestCount = metadata?.requestCount || 0;

                    return (
                      <li key={client.sessionId}>
                        <button
                          type='button'
                          onClick={() => handleSelectClient(client.sessionId)}
                          class={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-base-300 hover:border-base-400 hover:bg-base-200'
                          }`}
                        >
                          <div class='flex items-start justify-between'>
                            <div class='flex-1'>
                              {/* Client Name */}
                              <div class='font-semibold text-base'>
                                {clientName}
                                {clientVersion && (
                                  <span class='ml-2 text-xs font-normal opacity-60'>
                                    v{clientVersion}
                                  </span>
                                )}
                              </div>

                              {/* Transport Badge */}
                              <div class='mt-1 flex items-center gap-2'>
                                <span
                                  class={`badge badge-sm ${
                                    client.transport === 'stdio' ? 'badge-info' : 'badge-success'
                                  }`}
                                >
                                  {client.transport.toUpperCase()}
                                </span>

                                {/* Request Count */}
                                <span class='text-xs opacity-60'>
                                  {requestCount} request{requestCount !== 1 ? 's' : ''}
                                </span>
                              </div>

                              {/* Session ID */}
                              <div class='mt-1 text-xs font-mono opacity-50'>
                                {client.sessionId.slice(0, 8)}...
                              </div>

                              {/* Last Meta Indicator */}
                              {metadata?.lastMeta && (
                                <div class='mt-1'>
                                  <span class='badge badge-xs badge-outline'>
                                    has _meta
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Selection Indicator */}
                            {isSelected && (
                              <div class='ml-3'>
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  class='h-6 w-6 text-primary'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke='currentColor'
                                >
                                  <path
                                    stroke-linecap='round'
                                    stroke-linejoin='round'
                                    stroke-width='2'
                                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          )}

        {/* Selection Info */}
        {selectedClientId.value && (
          <div class='text-xs opacity-60 mt-2'>
            Selected: <span class='font-mono'>{selectedClientId.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
