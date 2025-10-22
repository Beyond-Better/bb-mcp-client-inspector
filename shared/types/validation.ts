/**
 * Validation Schemas
 * 
 * Zod schemas for runtime validation of console commands and payloads.
 */

import { z } from "zod";

/**
 * Console command schema
 */
export const consoleCommandSchema = z.object({
  type: z.enum([
    "trigger_notification",
    "request_sampling",
    "request_elicitation",
    "get_clients",
    "get_message_history",
  ]),
  payload: z.unknown().optional(),
});

/**
 * Notification payload schema
 */
export const notificationPayloadSchema = z.object({
  level: z.enum([
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
    "alert",
    "emergency",
  ]),
  logger: z.string().optional(),
  data: z.unknown(),
  sessionId: z.string().optional(),
});

/**
 * Sampling content schema
 */
const samplingContentSchema = z.union([
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("image"),
    data: z.string(),
    mimeType: z.string(),
  }),
]);

/**
 * Sampling message schema
 */
const samplingMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: samplingContentSchema,
});

/**
 * Model preferences schema
 */
const modelPreferencesSchema = z.object({
  hints: z
    .array(
      z.object({
        name: z.string().optional(),
      })
    )
    .optional(),
  costPriority: z.number().min(0).max(1).optional(),
  speedPriority: z.number().min(0).max(1).optional(),
  intelligencePriority: z.number().min(0).max(1).optional(),
});

/**
 * Sampling payload schema
 */
export const samplingPayloadSchema = z.object({
  messages: z.array(samplingMessageSchema).min(1, "At least one message required"),
  modelPreferences: modelPreferencesSchema.optional(),
  systemPrompt: z.string().optional(),
  includeContext: z.enum(["none", "thisServer", "allServers"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive(),
  stopSequences: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Elicitation schema property (recursive)
 */
const elicitationSchemaPropertySchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum(["string", "number", "boolean", "array", "object"]),
    description: z.string().optional(),
    enum: z.array(z.unknown()).optional(),
    enumNames: z.array(z.string()).optional(),
    items: elicitationSchemaPropertySchema.optional(),
    properties: z.record(elicitationSchemaPropertySchema).optional(),
  })
);

/**
 * Elicitation schema
 */
const elicitationSchemaSchema = z.object({
  type: z.enum(["object", "string", "number", "boolean", "array"]),
  properties: z.record(elicitationSchemaPropertySchema).optional(),
  required: z.array(z.string()).optional(),
  description: z.string().optional(),
});

/**
 * Elicitation payload schema
 */
export const elicitationPayloadSchema = z.object({
  message: z.string().min(1, "Message is required"),
  requestedSchema: elicitationSchemaSchema,
});

/**
 * Message history request payload schema
 */
export const messageHistoryPayloadSchema = z.object({
  sessionId: z.string().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

/**
 * Client info schema
 */
export const clientInfoSchema = z.object({
  clientId: z.string(),
  sessionId: z.string(),
  connectedAt: z.number(),
  lastSeen: z.number(),
  transport: z.enum(["stdio", "http"]),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate console command
 * 
 * @param data - Unknown data to validate
 * @returns Validation result with typed data or error
 */
export function validateConsoleCommand(data: unknown) {
  return consoleCommandSchema.safeParse(data);
}

/**
 * Validate notification payload
 */
export function validateNotificationPayload(data: unknown) {
  return notificationPayloadSchema.safeParse(data);
}

/**
 * Validate sampling payload
 */
export function validateSamplingPayload(data: unknown) {
  return samplingPayloadSchema.safeParse(data);
}

/**
 * Validate elicitation payload
 */
export function validateElicitationPayload(data: unknown) {
  return elicitationPayloadSchema.safeParse(data);
}

/**
 * Validate message history payload
 */
export function validateMessageHistoryPayload(data: unknown) {
  return messageHistoryPayloadSchema.safeParse(data);
}

/**
 * Format Zod error for user-friendly display
 */
export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((err) => `${err.path.join(".")}: ${err.message}`)
    .join(", ");
}
