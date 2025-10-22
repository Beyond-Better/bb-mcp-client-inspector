/**
 * Sampling Form Component
 *
 * Form for requesting LLM completions from MCP clients.
 * Supports basic text prompts with model preferences.
 */

import { signal } from "@preact/signals";
import { sendCommand, wsConnected } from "../hooks/useWebSocket.ts";
import { selectedClientId } from "../hooks/useConsoleState.ts";
import type { SamplingPayload } from "@shared/types/index.ts";

// Local state for form
const message = signal("");
const model = signal("");
const temperature = signal(0.7);
const maxTokens = signal(1000);

export default function SamplingForm() {
  const handleSubmit = () => {
    if (!message.value.trim()) {
      alert("Please enter a message");
      return;
    }

    const payload: SamplingPayload = {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: message.value,
          },
        },
      ],
      modelPreferences: model.value
        ? {
          hints: [{ name: model.value }],
        }
        : undefined,
      temperature: temperature.value,
      maxTokens: maxTokens.value,
      sessionId: selectedClientId.value || undefined, // Target specific client
    };

    console.log("[SamplingForm] Sending request:", payload);
    sendCommand({
      type: "request_sampling",
      payload,
    });
  };

  const handleClear = () => {
    message.value = "";
    model.value = "";
    temperature.value = 0.7;
    maxTokens.value = 1000;
  };

  return (
    <div class="space-y-4">
      {/* Message Input */}
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Prompt</span>
          <span class="label-text-alt">
            <span class="badge badge-sm badge-ghost">Required</span>
          </span>
        </label>
        <textarea
          class="textarea textarea-bordered h-32 w-full"
          placeholder="What is the capital of France?"
          value={message.value}
          onInput={(
            e,
          ) => (message.value = (e.target as HTMLTextAreaElement).value)}
        />
      </div>

      {/* Model Input */}
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Model (optional)</span>
        </label>
        <input
          type="text"
          class="input input-bordered w-full"
          placeholder="e.g., gpt-4, claude-3-sonnet"
          value={model.value}
          onInput={(e) => (model.value = (e.target as HTMLInputElement).value)}
        />
        <label class="label">
          <span class="label-text-alt opacity-70">
            Leave empty for client default
          </span>
        </label>
      </div>

      {/* Parameters Grid */}
      <div class="grid grid-cols-2 gap-4">
        {/* Temperature */}
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Temperature</span>
            <span class="label-text-alt">{temperature.value.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature.value}
            onInput={(
              e,
            ) => (temperature.value = parseFloat(
              (e.target as HTMLInputElement).value,
            ))}
            class="range range-primary range-sm"
          />
          <div class="w-full flex justify-between text-xs px-2 opacity-60">
            <span>0</span>
            <span>1</span>
            <span>2</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Max Tokens</span>
            <span class="label-text-alt">{maxTokens.value}</span>
          </label>
          <input
            type="number"
            min="1"
            max="4096"
            value={maxTokens.value}
            onInput={(
              e,
            ) => (maxTokens.value = parseInt(
              (e.target as HTMLInputElement).value,
            ))}
            class="input input-bordered input-sm w-full"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div class="card-actions justify-end">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          onClick={handleClear}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Clear
        </button>
        <button
          type="button"
          class="btn btn-primary btn-wide"
          disabled={!wsConnected.value || !message.value.trim()}
          onClick={handleSubmit}
        >
          🧠 Request Completion
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Info Alert */}
      <div class="alert shadow-lg">
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="stroke-info shrink-0 w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 class="font-bold">How it works</h3>
            <div class="text-xs">
              Client will generate a completion using the configured LLM.
              Response will include generated text and token usage.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
