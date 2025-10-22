/**
 * Console Manager
 *
 * Manages WebSocket connections from the Fresh UI console.
 * Handles real-time message broadcasting and command processing.
 */

import type { BeyondMcpServer, Logger } from "@beyondbetter/bb-mcp-server";
import type { MessageTracker } from "./MessageTracker.ts";
import type {
  //ConsoleCommand,
  ConsoleMessage,
  ElicitationPayload,
  NotificationPayload,
  SamplingPayload,
  //SessionId,
} from "@shared/types/index.ts";
import { formatZodError, validateConsoleCommand } from "@shared/types/index.ts";
import { errorMessage, toError } from "@shared/types/index.ts";

export class ConsoleManager {
  private wsConnections: Map<string, WebSocket>;
  private messageTracker: MessageTracker;
  private logger: Logger;
  private beyondMcpServer?: BeyondMcpServer; // Set when handle() is called

  constructor(
    messageTracker: MessageTracker,
    logger: Logger,
  ) {
    this.messageTracker = messageTracker;
    this.logger = logger;
    this.wsConnections = new Map();

    this.logger.info("ConsoleManager: initialized");
  }

  /**
   * Handle WebSocket upgrade request
   */
  // deno-lint-ignore require-await
  async handle(
    request: Request,
    dependencies: { beyondMcpServer: BeyondMcpServer },
  ): Promise<Response> {
    // Check if this is a WebSocket upgrade request
    const upgrade = request.headers.get("upgrade");
    if (upgrade !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    try {
      const { socket, response } = Deno.upgradeWebSocket(request);
      const connectionId = crypto.randomUUID();
      const beyondMcpServer = dependencies.beyondMcpServer;

      // Store beyondMcpServer for later use
      this.beyondMcpServer = beyondMcpServer;

      socket.onopen = () => {
        this.handleConnection(connectionId, socket);
      };

      socket.onmessage = (event) => {
        this.handleMessage(connectionId, event.data, beyondMcpServer);
      };

      socket.onclose = () => {
        this.handleDisconnection(connectionId);
      };

      socket.onerror = (error) => {
        this.logger.error(
          `ConsoleManager: WebSocket error for ${connectionId}:`,
          toError(error),
        );
      };

      return response;
    } catch (error) {
      this.logger.error(
        "ConsoleManager: Failed to upgrade WebSocket:",
        toError(error),
      );
      return new Response("WebSocket upgrade failed", { status: 500 });
    }
  }

  /**
   * Handle new console connection
   */
  private handleConnection(connectionId: string, socket: WebSocket): void {
    this.wsConnections.set(connectionId, socket);
    this.logger.info(
      `ConsoleManager: Console client connected: ${connectionId}`,
    );

    // Send welcome message
    this.sendToClient(connectionId, {
      type: "connection_established",
      payload: {
        connectionId,
        serverVersion: "1.0.0",
      },
      timestamp: Date.now(),
    });

    // Send current client list
    this.sendClientListToAll();
  }

  /**
   * Handle console disconnection
   */
  private handleDisconnection(connectionId: string): void {
    this.wsConnections.delete(connectionId);
    this.logger.info(
      `ConsoleManager: Console client disconnected: ${connectionId}`,
    );
    this.sendClientListToAll();
  }

  /**
   * Handle incoming message from console
   */
  private async handleMessage(
    connectionId: string,
    data: string,
    beyondMcpServer: BeyondMcpServer,
  ): Promise<void> {
    try {
      const parsed = JSON.parse(data);

      // Validate command with Zod
      const validation = validateConsoleCommand(parsed);
      if (!validation.success) {
        this.logger.warn(
          `ConsoleManager: Invalid command from ${connectionId}:`,
          formatZodError(validation.error),
        );
        this.sendToClient(connectionId, {
          type: "error",
          payload: {
            message: "Invalid command format",
            details: formatZodError(validation.error),
          },
          timestamp: Date.now(),
        });
        return;
      }

      const command = validation.data;
      this.logger.debug(
        `ConsoleManager: Console command from ${connectionId}:`,
        command.type,
      );

      switch (command.type) {
        case "trigger_notification":
          await this.triggerNotification(
            command.payload as NotificationPayload,
            beyondMcpServer,
          );
          break;

        case "request_sampling":
          await this.requestSampling(
            command.payload as SamplingPayload,
            beyondMcpServer,
          );
          break;

        case "request_elicitation":
          await this.requestElicitation(
            command.payload as ElicitationPayload,
            beyondMcpServer,
          );
          break;

        case "get_clients":
          await this.sendClientList(connectionId, beyondMcpServer);
          break;

        case "get_message_history":
          await this.sendMessageHistory(connectionId, command.payload);
          break;

        default:
          this.logger.warn(
            `ConsoleManager: Unknown command type: ${command.type}`,
          );
          this.sendToClient(connectionId, {
            type: "error",
            payload: {
              message: `Unknown command type: ${command.type}`,
            },
            timestamp: Date.now(),
          });
      }
    } catch (error) {
      this.logger.error(
        "ConsoleManager: Error handling console message:",
        toError(error),
      );
      this.sendToClient(connectionId, {
        type: "error",
        payload: {
          message: "Failed to process command",
          error: errorMessage(error),
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Trigger notification to MCP clients
   * Uses library's sendNotification method
   */
  private async triggerNotification(
    payload: NotificationPayload,
    beyondMcpServer: BeyondMcpServer,
  ): Promise<void> {
    try {
      this.logger.info("ConsoleManager: Triggering notification", {
        level: payload.level,
        logger: payload.logger,
      });

      // Use library's sendNotification method
      await beyondMcpServer.sendNotification(
        {
          level: payload.level,
          logger: payload.logger,
          data: payload.data,
        },
        payload.sessionId,
      );

      this.broadcastMessage({
        type: "notification_sent",
        payload: {
          level: payload.level,
          logger: payload.logger,
          data: payload.data,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        "ConsoleManager: Error triggering notification:",
        toError(error),
      );
      this.broadcastMessage({
        type: "notification_error",
        payload: {
          message: "Failed to send notification",
          error: errorMessage(error),
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Request sampling from MCP client
   * Note: Converts UI payload to library's CreateMessageRequest format
   */
  private async requestSampling(
    payload: SamplingPayload,
    beyondMcpServer: BeyondMcpServer,
  ): Promise<void> {
    try {
      this.logger.info("ConsoleManager: Requesting sampling from client", {
        sessionId: payload.sessionId,
      });

      // Convert to library's CreateMessageRequest format
      const response = await beyondMcpServer.createMessage({
        model: payload.modelPreferences?.hints?.[0]?.name || "default",
        messages: payload.messages.map((msg) => ({
          role: msg.role,
          content: {
            type: "text" as const,
            text: msg.content.type === "text" ? msg.content.text : "",
          },
        })),
        maxTokens: payload.maxTokens,
        temperature: payload.temperature,
        stopSequences: payload.stopSequences,
      }, payload.sessionId); // Pass sessionId for client targeting

      this.broadcastMessage({
        type: "sampling_response",
        payload: response,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        "ConsoleManager: Error requesting sampling:",
        toError(error),
      );
      this.broadcastMessage({
        type: "sampling_error",
        payload: {
          message: "Sampling request failed",
          error: errorMessage(error),
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Request elicitation from MCP client
   */
  private async requestElicitation(
    payload: ElicitationPayload,
    beyondMcpServer: BeyondMcpServer,
  ): Promise<void> {
    try {
      this.logger.info("ConsoleManager: Requesting elicitation from client", {
        sessionId: payload.sessionId,
      });
      this.logger.debug("ConsoleManager: Elicitation request payload:", {
        message: payload.message,
        requestedSchema: payload.requestedSchema,
        sessionId: payload.sessionId,
      });

      const response = await beyondMcpServer.elicitInput({
        message: payload.message,
        requestedSchema: payload.requestedSchema,
      }, payload.sessionId);

      this.logger.debug("ConsoleManager: Elicitation response received:", {
        response: JSON.stringify(response, null, 2),
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : [],
      }); // Pass sessionId for client targeting

      this.broadcastMessage({
        type: "elicitation_response",
        payload: response,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        "ConsoleManager: Error requesting elicitation:",
        toError(error),
        {
          errorMessage: errorMessage(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          payloadSent: {
            message: payload.message,
            requestedSchema: payload.requestedSchema,
            sessionId: payload.sessionId,
          },
        },
      );
      this.broadcastMessage({
        type: "elicitation_error",
        payload: {
          message: "Elicitation request failed",
          error: errorMessage(error),
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Send client list to specific console
   * Gets client info from TransportManager (tracks actual MCP clients)
   */
  // deno-lint-ignore require-await
  private async sendClientList(
    connectionId: string,
    beyondMcpServer: BeyondMcpServer,
  ): Promise<void> {
    try {
      // Get clients from TransportManager (unified API for HTTP and STDIO)
      const transportManager = beyondMcpServer.getTransportManager();
      const clientSessions = transportManager.getClientSessions();

      // Convert to ClientInfo format expected by console
      const clients = clientSessions.map((session) => ({
        clientId: session.sessionId,
        sessionId: session.sessionId,
        connectedAt: session.connectedAt,
        lastSeen: session.lastActivity,
        transport: session.transport,
        metadata: {
          clientInfo: session.clientInfo,
          protocolVersion: session.protocolVersion,
          requestCount: session.requestCount,
          lastMeta: session.lastMeta,
        },
      }));

      this.sendToClient(connectionId, {
        type: "client_list",
        payload: { clients },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        "ConsoleManager: Error getting client list:",
        toError(error),
      );
      this.sendToClient(connectionId, {
        type: "error",
        payload: {
          message: "Failed to retrieve client list",
          error: errorMessage(error),
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Send client list to all consoles
   * Gets client info from TransportManager (tracks actual MCP clients)
   */
  // deno-lint-ignore require-await
  private async sendClientListToAll(): Promise<void> {
    try {
      if (!this.beyondMcpServer) {
        this.logger.warn(
          "ConsoleManager: Cannot get client list - beyondMcpServer not initialized",
        );
        return;
      }

      // Get clients from TransportManager (unified API for HTTP and STDIO)
      const transportManager = this.beyondMcpServer.getTransportManager();
      const clientSessions = transportManager.getClientSessions();

      // Convert to ClientInfo format expected by console
      const clients = clientSessions.map((session) => ({
        clientId: session.sessionId,
        sessionId: session.sessionId,
        connectedAt: session.connectedAt,
        lastSeen: session.lastActivity,
        transport: session.transport,
        metadata: {
          clientInfo: session.clientInfo,
          protocolVersion: session.protocolVersion,
          requestCount: session.requestCount,
          lastMeta: session.lastMeta,
        },
      }));

      this.broadcastMessage({
        type: "client_list",
        payload: { clients },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        "ConsoleManager: Error broadcasting client list:",
        toError(error),
      );
    }
  }

  /**
   * Send message history to console
   */
  private async sendMessageHistory(
    connectionId: string,
    // deno-lint-ignore no-explicit-any
    payload: any,
  ): Promise<void> {
    try {
      const messages = await this.messageTracker.getMessages(
        payload.sessionId || "default",
        payload.limit || 100,
      );

      this.sendToClient(connectionId, {
        type: "message_history",
        payload: { messages },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        "ConsoleManager: Error getting message history:",
        toError(error),
      );
      this.sendToClient(connectionId, {
        type: "error",
        payload: {
          message: "Failed to retrieve message history",
          error: errorMessage(error),
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Broadcast MCP protocol message to all consoles
   */
  broadcastMessage(message: ConsoleMessage): void {
    const payload = JSON.stringify(message);

    for (const [id, ws] of this.wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (error) {
          this.logger.error(
            `ConsoleManager: Error sending to console ${id}:`,
            toError(error),
          );
        }
      }
    }
  }

  /**
   * Send message to specific console
   */
  private sendToClient(connectionId: string, message: ConsoleMessage): void {
    const ws = this.wsConnections.get(connectionId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        this.logger.error(
          `ConsoleManager: Error sending to console ${connectionId}:`,
          toError(error),
        );
      }
    }
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.wsConnections.size;
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connectionCount: number;
    connections: Array<{ id: string; state: string }>;
  } {
    const connections = Array.from(this.wsConnections.entries()).map((
      [id, ws],
    ) => ({
      id,
      state: ["CONNECTING", "OPEN", "CLOSING", "CLOSED"][ws.readyState],
    }));

    return {
      connectionCount: this.wsConnections.size,
      connections,
    };
  }
}
