/**
 * Sampling Response Component
 *
 * Displays the most recent sampling response from the MCP client.
 * Shows the generated text content and metadata like model and stop reason.
 */

import { computed } from "@preact/signals";
import { wsMessages } from "../hooks/useWebSocket.ts";
import type {
  ErrorPayload,
  SamplingResponsePayload,
} from "@shared/types/index.ts";
import { isSamplingError, isSamplingResponse } from "@shared/types/index.ts";

export default function SamplingResponse() {
  // Find the most recent sampling response or error
  const latestResponse = computed(() => {
    const messages = wsMessages.value;
    // Search backwards for most recent sampling response/error
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (isSamplingResponse(msg) || isSamplingError(msg)) {
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
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <p class="text-sm opacity-60">No responses yet</p>
          <p class="text-xs opacity-50">
            Send a sampling request to see results here
          </p>
        </div>
      </div>
    );
  }

  const response = latestResponse.value;

  // Handle error response
  if (isSamplingError(response)) {
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
              <h3 class="font-bold text-error">Sampling Failed</h3>
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
  const payload = response.payload as SamplingResponsePayload;

  // Extract text content (handle both text and potential image content)
  const textContent = payload.content?.type === "text"
    ? payload.content.text
    : "";

  return (
    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body">
        {/* Header with Metadata */}
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="badge badge-success badge-lg gap-2">
              <span class="text-lg">🧠</span>
              <span class="font-semibold">Completion</span>
            </div>
            {payload.model && (
              <div class="tooltip" data-tip="Model used for generation">
                <div class="badge badge-outline badge-sm">
                  {payload.model}
                </div>
              </div>
            )}
            {payload.stopReason && (
              <div class="tooltip" data-tip="Why generation stopped">
                <div class="badge badge-ghost badge-sm">
                  {payload.stopReason === "endTurn" && "🏁 End Turn"}
                  {payload.stopReason === "stopSequence" && "🛑 Stop Sequence"}
                  {payload.stopReason === "maxTokens" && "📏 Max Tokens"}
                </div>
              </div>
            )}
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

        {/* Generated Content */}
        {textContent && (
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
              <span class="text-sm font-medium">Generated Text</span>
            </div>
            <div class="bg-base-200 rounded-lg p-4">
              <p class="text-sm leading-relaxed whitespace-pre-wrap">
                {textContent}
              </p>
            </div>
          </div>
        )}

        {/* Empty State (shouldn't happen but just in case) */}
        {!textContent && (
          <div class="mt-4 alert alert-warning">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span class="text-sm">No text content in response</span>
          </div>
        )}
      </div>
    </div>
  );
}
