/**
 * Echo Tool
 *
 * Simple tool that echoes back the provided message with optional transformations.
 * Useful for testing basic tool execution and response handling.
 */

import { z } from "zod";
import type {
  InferZodSchema,
  ToolDependencies,
  ToolRegistration,
} from "@beyondbetter/bb-mcp-server";
import { toError } from "@beyondbetter/bb-mcp-server";

// Input schema
const echoInputSchema = {
  message: z.string().describe("Message to echo back"),
  delay: z.number().int().min(0).max(10000).optional()
    .describe("Delay in milliseconds before responding (0-10000)"),
  uppercase: z.boolean().optional()
    .describe("Convert message to uppercase"),
} as const;

export function getTools(dependencies: ToolDependencies): ToolRegistration[] {
  const { logger } = dependencies;

  return [
    {
      name: "echo",
      definition: {
        title: "Echo",
        description:
          "Echo back the provided message, optionally with a delay or transformation",
        category: "Testing",
        inputSchema: echoInputSchema,
      },
      handler: async (args: InferZodSchema<typeof echoInputSchema>) => {
        try {
          logger.debug("Echo tool called", { args });

          // Apply delay if specified
          if (args.delay && args.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, args.delay));
          }

          // Transform message if requested
          let responseMessage = args.message;
          if (args.uppercase) {
            responseMessage = responseMessage.toUpperCase();
          }

          return {
            content: [
              {
                type: "text",
                text: responseMessage,
              },
            ],
          };
        } catch (error) {
          logger.error("Echo tool failed:", toError(error));
          return {
            content: [
              {
                type: "text",
                text: `Error: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
              },
            ],
            isError: true,
          };
        }
      },
    },
  ];
}
