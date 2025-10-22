/**
 * Command Panel Component
 *
 * Tabbed interface for different MCP testing capabilities.
 * Uses DaisyUI tabs and card components.
 */

import { activeTab } from "../hooks/useConsoleState.ts";
import NotificationForm from "./NotificationForm.tsx";
import SamplingForm from "./SamplingForm.tsx";
import SamplingResponse from "./SamplingResponse.tsx";
import ElicitationForm from "./ElicitationForm.tsx";
import ElicitationResponse from "./ElicitationResponse.tsx";

export default function CommandPanel() {
  const tabs = [
    {
      id: "notifications",
      label: "🔔 Notifications",
      icon: "bell",
      disabled: false,
    },
    { id: "sampling", label: "🧠 Sampling", icon: "brain", disabled: false },
    {
      id: "elicitation",
      label: "❓ Elicitation",
      icon: "question",
      disabled: false,
    },
  ];

  return (
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">🎮 Command Panel</h2>

        {/* Tabs */}
        <div class="join w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              class={`btn join-item flex-1 ${
                activeTab.value === tab.id ? "btn-primary" : "btn-outline"
              }`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && (activeTab.value = tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div class="mt-4">
          {activeTab.value === "notifications" && <NotificationForm />}

          {activeTab.value === "sampling" && <SamplingForm />}

          {activeTab.value === "elicitation" && <ElicitationForm />}
        </div>

        {/* Response Display (shown when sampling or elicitation tab is active) */}
        {activeTab.value === "sampling" && (
          <div class="mt-6">
            <div class="divider">Latest Response</div>
            <SamplingResponse />
          </div>
        )}

        {activeTab.value === "elicitation" && (
          <div class="mt-6">
            <div class="divider">Latest Response</div>
            <ElicitationResponse />
          </div>
        )}
      </div>
    </div>
  );
}
