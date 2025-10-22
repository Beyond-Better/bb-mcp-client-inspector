/**
 * Elicitation Form Component
 *
 * Unified component for testing both user approval and form-based elicitation.
 * Supports two modes:
 * - Approval Mode: Simple approve/decline/cancel (no schema)
 * - Form Mode: Message + JSON schema for structured data collection
 */

import { signal } from "@preact/signals";
import { sendCommand } from "../hooks/useWebSocket.ts";
import { wsConnected } from "../hooks/useWebSocket.ts";
import { selectedClientId } from "../hooks/useConsoleState.ts";
import type {
  ElicitationPayload,
  ElicitationSchema,
} from "@shared/types/index.ts";
import {
  formatZodError,
  validateElicitationPayload,
} from "@shared/types/index.ts";

// Local state for form
const elicitationMode = signal<"approval" | "form">("approval");
const message = signal("");
const schemaJson = signal("");

// Sample schemas for user guidance
const SCHEMA_SAMPLE_SIMPLE = `{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "title": "Your Name",
      "description": "Enter your full name"
    },
    "age": {
      "type": "number",
      "title": "Your age",
      "description": "Enter your age"
    },
    "action_type": {
      "type": "string",
      "title": "Action Type",
      "description": "What action do you want to perform?",
      "enum": ["Create", "Update", "Delete", "View"]
    },
    "confirm": {
      "type": "boolean",
      "title": "Confirmation",
      "description": "I understand the consequences of this action"
    }
  },
  "required": ["name", "action_type"]
}
`;
const SCHEMA_SAMPLE_ADVANCED = `{
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "title": "Username",
      "description": "Enter your username (3-20 characters)",
      "minLength": 3,
      "maxLength": 20
    },
    "email": {
      "type": "string",
      "title": "Email Address",
      "description": "Enter a valid email address",
      "format": "email"
    },
    "message": {
      "type": "string",
      "title": "Message",
      "description": "Enter your message or feedback",
      "format": "textarea"
    },
    "priority": {
      "type": "string",
      "title": "Priority Level",
      "description": "Select the priority for this request",
      "enum": ["Low", "Medium", "High", "Critical"]
    },
    "quantity": {
      "type": "number",
      "title": "Quantity",
      "description": "Enter a quantity (1-100)",
      "minimum": 1,
      "maximum": 100
    },
    "agree": {
      "type": "boolean",
      "title": "Agreement",
      "description": "I agree to the terms and conditions"
    },
    "website": {
      "type": "string",
      "title": "Website URL",
      "description": "Enter a website URL",
      "format": "url"
    }
  },
  "required": ["username", "email", "priority"]
}`;

export default function ElicitationForm() {
  const handleSubmit = () => {
    if (!message.value.trim()) {
      alert("Please enter a message");
      return;
    }

    // Build payload based on mode
    const payload: ElicitationPayload = {
      message: message.value,
      requestedSchema: {
        type: "object",
        properties: {}, // Empty properties for approval mode
      },
      sessionId: selectedClientId.value || undefined, // Target specific client
    };

    // Add schema if in form mode and schema provided
    if (elicitationMode.value === "form" && schemaJson.value.trim()) {
      try {
        payload.requestedSchema = JSON.parse(
          schemaJson.value,
        ) as ElicitationSchema;
      } catch (error) {
        alert(`Invalid JSON schema: ${(error as Error).message}`);
        return;
      }
    }

    // Validate payload with Zod
    const validation = validateElicitationPayload(payload);
    if (!validation.success) {
      alert(`Validation error: ${formatZodError(validation.error)}`);
      return;
    }

    console.log("[ElicitationForm] Sending request:", payload);
    sendCommand({
      type: "request_elicitation",
      payload: validation.data,
    });
  };

  const handleClear = () => {
    message.value = "";
    schemaJson.value = "";
  };

  return (
    <div class="space-y-6">
      {/* Mode Toggle */}
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium text-base">Elicitation Mode</span>
        </label>
        <div class="join w-full">
          <button
            type="button"
            class={`btn join-item flex-1 ${
              elicitationMode.value === "approval"
                ? "btn-primary"
                : "btn-outline"
            }`}
            onClick={() => (elicitationMode.value = "approval")}
          >
            ✅ Approval
          </button>
          <button
            type="button"
            class={`btn join-item flex-1 ${
              elicitationMode.value === "form" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => (elicitationMode.value = "form")}
          >
            📋 Form
          </button>
        </div>
        <label class="label">
          <span class="label-text-alt opacity-70">
            {elicitationMode.value === "approval"
              ? "Simple user approval (accept/decline/cancel)"
              : "Structured form data with JSON schema"}
          </span>
        </label>
      </div>

      {/* Message Input */}
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Message</span>
          <span class="label-text-alt">
            <span class="badge badge-sm badge-ghost">Required</span>
          </span>
        </label>
        <textarea
          class="textarea textarea-bordered textarea-md h-28 w-full"
          placeholder={elicitationMode.value === "approval"
            ? "Do you approve this action?"
            : "Please provide your contact information."}
          value={message.value}
          onInput={(
            e,
          ) => (message.value = (e.target as HTMLTextAreaElement).value)}
        />
        <label class="label">
          <span class="label-text-alt opacity-70">
            Message shown to the user
          </span>
        </label>
      </div>

      {/* Schema Input (Form Mode Only) */}
      {elicitationMode.value === "form" && (
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">JSON Schema</span>
            <span class="label-text-alt">
              <button
                type="button"
                class="btn btn-xs btn-ghost gap-1"
                onClick={() => (schemaJson.value = SCHEMA_SAMPLE_SIMPLE)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Load Simple Example
              </button>
            </span>
            <span class="label-text-alt">
              <button
                type="button"
                class="btn btn-xs btn-ghost gap-1"
                onClick={() => (schemaJson.value = SCHEMA_SAMPLE_ADVANCED)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Load Advanced Example
              </button>
            </span>
          </label>
          <textarea
            class="textarea textarea-bordered textarea-xs h-56 w-full font-mono leading-relaxed"
            placeholder="{}"
            value={schemaJson.value}
            onInput={(
              e,
            ) => (schemaJson.value = (e.target as HTMLTextAreaElement).value)}
          />
          <label class="label">
            <span class="label-text-alt opacity-70">
              JSON Schema for form validation
            </span>
          </label>
        </div>
      )}

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
          {elicitationMode.value === "approval"
            ? "Request Approval"
            : "Request Form Data"}
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
              {elicitationMode.value === "approval"
                ? "Client will show approval dialog with Accept/Decline/Cancel options."
                : "Client will show a form based on the schema. Response will include filled data."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
