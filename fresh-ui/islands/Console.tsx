/**
 * Console Island - Main Interactive Component
 *
 * Orchestrates the console UI by initializing WebSocket and composing child components.
 * Uses direct WebSocket initialization pattern with module-scoped signals.
 */

import { useEffect } from "preact/hooks";
import { closeWebSocket, initWebSocket } from "../hooks/useWebSocket.ts";
import { VERSION } from "@shared/version.ts";
import ConnectionStatus from "../components/ConnectionStatus.tsx";
import ClientSelector from "../components/ClientSelector.tsx";
import MessageViewer from "../components/MessageViewer.tsx";
import CommandPanel from "../components/CommandPanel.tsx";
import StatsPanel from "../components/StatsPanel.tsx";

interface ConsoleProps {
  wsUrl: string;
}

export default function Console({ wsUrl }: ConsoleProps) {
  // Initialize WebSocket connection
  useEffect(() => {
    console.log(`[Console] Initializing WebSocket connection to ${wsUrl}`);
    initWebSocket(wsUrl);

    // Cleanup on unmount
    return () => {
      console.log("[Console] Cleaning up WebSocket connection");
      closeWebSocket();
    };
  }, [wsUrl]);

  return (
    <div class="min-h-screen bg-base-200">
      {/* Header */}
      <header class="bg-base-100 shadow-lg">
        <div class="container mx-auto">
          <div class="navbar px-4">
            <div class="flex-1">
              <div>
                <h1 class="text-3xl font-bold">
                  🔍 MCP Client Inspector
                </h1>
                <p class="text-sm opacity-60 mt-1">
                  Test sampling, elicitation, and notifications
                </p>
              </div>
            </div>
            <div class="flex-none">
              <ConnectionStatus />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="container mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls - Left Side */}
          <div class="lg:col-span-6 space-y-6">
            <ClientSelector />
            <CommandPanel />
          </div>

          {/* Message Viewer - Right Side */}
          <div class="lg:col-span-6 space-y-6">
            <StatsPanel />
            <MessageViewer />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer class="footer footer-center p-4 bg-base-100 text-base-content border-t mt-12">
        <div>
          <p class="text-sm">
            MCP Client Inspector v{VERSION} | Beyond Better
          </p>
        </div>
      </footer>
    </div>
  );
}
