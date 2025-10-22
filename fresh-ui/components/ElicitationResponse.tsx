/**
 * Elicitation Response Component
 *
 * Displays the most recent elicitation response from the MCP client.
 * Shows action taken (accept/decline/cancel) and any form data returned.
 */

import { computed } from "@preact/signals";
import { wsMessages } from "../hooks/useWebSocket.ts";
import type {
  //ConsoleMessage,
  ElicitationResponsePayload,
  ErrorPayload,
} from "@shared/types/index.ts";
import {
  isElicitationError,
  isElicitationResponse,
} from "@shared/types/index.ts";

export default function ElicitationResponse() {
  // Find the most recent elicitation response or error
  const latestResponse = computed(() => {
    const messages = wsMessages.value;
    // Search backwards for most recent elicitation response/error
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (isElicitationResponse(msg) || isElicitationError(msg)) {
        return msg;
      }
    }
    return null;
  });

  // If no response yet, show placeholder
  if (!latestResponse.value) {
    return (
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body items-center text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="stroke-base-content/30 w-12 h-12"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p class="text-sm opacity-60">No responses yet</p>
          <p class="text-xs opacity-50">
            Send an elicitation request to see results here
          </p>
        </div>
      </div>
    );
  }

  const response = latestResponse.value;

  // Handle error response
  if (isElicitationError(response)) {
    const payload = response.payload as ErrorPayload;
    return (
      <div class="card bg-error/10 border border-error/20 shadow-sm">
        <div class="card-body">
          <div class="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-error shrink-0 h-6 w-6 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="flex-1">
              <h3 class="font-bold text-error">Elicitation Failed</h3>
              <p class="text-sm mt-1 opacity-90">
                {payload.message || "Unknown error"}
              </p>
              {payload.error && (
                <div class="mt-3 p-3 bg-base-200 rounded-lg">
                  <div class="text-xs font-mono leading-relaxed">
                    {payload.error}
                  </div>
                  {payload.code && (
                    <div class="badge badge-sm badge-ghost mt-2">
                      {payload.code}
                    </div>
                  )}
                </div>
              )}
              {response.timestamp && (
                <div class="text-xs opacity-50 mt-3">
                  {new Date(response.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle success response
  const payload = response.payload as ElicitationResponsePayload;

  // Extract form data - could be in 'content' field or at root level
  const formData = payload.content ||
    Object.fromEntries(
      Object.entries(payload).filter(([key]) =>
        key !== "action" && key !== "responseText"
      ),
    );

  const actionConfig = {
    accept: {
      badge: "badge-success",
      icon: "✅",
      label: "Accepted",
      description: "User accepted the request",
    },
    decline: {
      badge: "badge-error",
      icon: "❌",
      label: "Declined",
      description: "User declined the request",
    },
    cancel: {
      badge: "badge-warning",
      icon: "🚫",
      label: "Cancelled",
      description: "User cancelled the request",
    },
  };

  const config = actionConfig[payload.action] || actionConfig.cancel;

  return (
    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body">
        {/* Header with Action Badge */}
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class={`badge ${config.badge} badge-lg gap-2`}>
              <span class="text-lg">{config.icon}</span>
              <span class="font-semibold">{config.label}</span>
            </div>
            <span class="text-sm opacity-70">{config.description}</span>
          </div>
          {response.timestamp && (
            <div
              class="tooltip tooltip-left"
              data-tip={new Date(response.timestamp).toLocaleString()}
            >
              <div class="badge badge-ghost badge-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {new Date(response.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        {/* Form Data (if provided) */}
        {formData && Object.keys(formData).length > 0 && (
          <div class="mt-4">
            <div class="flex items-center gap-2 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 opacity-70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span class="text-sm font-medium">Form Data</span>
            </div>
            <div class="bg-base-200">
              <pre class="px-6"><code class="text-xs leading-relaxed">{JSON.stringify(formData, null, 2)}</code></pre>
            </div>
          </div>
        )}

        {/* Empty State for Approval */}
        {(!formData || Object.keys(formData).length === 0) &&
          payload.action === "accept" && (
          <div class="mt-4 alert alert-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="text-sm">User approved without additional data</span>
          </div>
        )}
      </div>
    </div>
  );
}
