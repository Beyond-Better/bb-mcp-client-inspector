/**
 * Console WebSocket Message Fixtures
 * 
 * Sample console messages for testing WebSocket communication.
 */

import type {
  ClientInfo,
  ConsoleCommand,
  ConsoleMessage,
  ElicitationPayload,
  NotificationPayload,
  SamplingPayload,
} from "@shared/types/index.ts";
import type { ClientId, SessionId } from "@shared/types/index.ts";

/**
 * Sample connection established message
 */
export const connectionEstablished: ConsoleMessage = {
  type: "connection_established",
  payload: {
    connectionId: "conn-123" as string,
    serverVersion: "1.0.0",
    timestamp: 1234567890,
  },
  timestamp: 1234567890,
};

/**
 * Sample client info
 */
export const sampleClientInfo: ClientInfo = {
  clientId: "client-1" as ClientId,
  sessionId: "session-1" as SessionId,
  connectedAt: 1234567890,
  lastSeen: 1234567900,
  transport: "http",
  metadata: {
    clientInfo: {
      name: "Test Client",
      version: "1.0.0",
    },
  },
};

/**
 * Sample client list message
 */
export const clientListMessage: ConsoleMessage = {
  type: "client_list",
  payload: {
    clients: [sampleClientInfo],
  },
  timestamp: 1234567890,
};

/**
 * Sample notification payload
 */
export const notificationPayload: NotificationPayload = {
  level: "info",
  logger: "test",
  data: "Test notification message",
};

/**
 * Sample trigger notification command
 */
export const triggerNotificationCommand: ConsoleCommand = {
  type: "trigger_notification",
  payload: notificationPayload,
};

/**
 * Sample notification sent message
 */
export const notificationSent: ConsoleMessage = {
  type: "notification_sent",
  payload: {
    level: "info",
    logger: "test",
    data: "Test notification message",
  },
  timestamp: 1234567890,
};

/**
 * Sample sampling payload
 */
export const samplingPayload: SamplingPayload = {
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: "What is 2+2?",
      },
    },
  ],
  maxTokens: 100,
  temperature: 0.7,
};

/**
 * Sample request sampling command
 */
export const requestSamplingCommand: ConsoleCommand = {
  type: "request_sampling",
  payload: samplingPayload,
};

/**
 * Sample sampling response message
 */
export const samplingResponseMessage: ConsoleMessage = {
  type: "sampling_response",
  payload: {
    content: {
      type: "text",
      text: "2+2 equals 4.",
    },
    model: "test-model",
    stopReason: "endTurn",
  },
  timestamp: 1234567890,
};

/**
 * Sample sampling error message
 */
export const samplingErrorMessage: ConsoleMessage = {
  type: "sampling_error",
  payload: {
    message: "Sampling request failed",
    error: "Client not available",
  },
  timestamp: 1234567890,
};

/**
 * Sample elicitation payload
 */
export const elicitationPayload: ElicitationPayload = {
  message: "Please confirm the action",
  requestedSchema: {
    type: "object",
    properties: {
      confirmed: {
        type: "boolean",
        description: "User confirmation",
      },
    },
    required: ["confirmed"],
  },
};

/**
 * Sample request elicitation command
 */
export const requestElicitationCommand: ConsoleCommand = {
  type: "request_elicitation",
  payload: elicitationPayload,
};

/**
 * Sample elicitation response message (accept)
 */
export const elicitationResponseMessage: ConsoleMessage = {
  type: "elicitation_response",
  payload: {
    action: "accept",
    content: {
      confirmed: true,
    },
  },
  timestamp: 1234567890,
};

/**
 * Sample elicitation error message
 */
export const elicitationErrorMessage: ConsoleMessage = {
  type: "elicitation_error",
  payload: {
    message: "Elicitation request failed",
    error: "Client declined",
  },
  timestamp: 1234567890,
};

/**
 * Sample get clients command
 */
export const getClientsCommand: ConsoleCommand = {
  type: "get_clients",
};

/**
 * Sample error message
 */
export const errorMessage: ConsoleMessage = {
  type: "error",
  payload: {
    message: "Invalid command format",
    details: "Missing required field",
  },
  timestamp: 1234567890,
};
