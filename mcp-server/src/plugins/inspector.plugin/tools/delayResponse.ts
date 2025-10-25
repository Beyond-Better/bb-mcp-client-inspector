/**
 * Delay Response Tool
 *
 * Introduces a configurable delay before responding.
 * Useful for testing timeout handling and async behavior.
 */

import { z } from 'zod';
import type {
  InferZodSchema,
  ToolDependencies,
  ToolRegistration,
} from '@beyondbetter/bb-mcp-server';
import { toError } from '@beyondbetter/bb-mcp-server';

// Input schema
const delayResponseInputSchema = {
  delay: z.number().int().min(0).max(60000)
    .describe('Delay duration in milliseconds (0-60000)'),
  message: z.string().optional()
    .describe('Optional message to return after delay'),
} as const;

export function getTools(dependencies: ToolDependencies): ToolRegistration[] {
  const { logger } = dependencies;

  return [
    {
      name: 'delay_response',
      definition: {
        title: 'Delay Response',
        description: 'Delay the response by a specified duration (for testing timeouts)',
        category: 'Testing',
        inputSchema: delayResponseInputSchema,
      },
      handler: async (
        args: InferZodSchema<typeof delayResponseInputSchema>,
      ) => {
        try {
          logger.debug('Delay response tool called', { args });

          const startTime = Date.now();

          // Wait for the specified delay
          await new Promise((resolve) => setTimeout(resolve, args.delay));

          const actualDelay = Date.now() - startTime;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    requestedDelay: args.delay,
                    actualDelay,
                    message: args.message || 'Delay completed',
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          logger.error('Delay response tool failed:', toError(error));
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      },
    },
  ];
}
