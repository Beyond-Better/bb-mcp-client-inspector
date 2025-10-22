/**
 * Trigger Error Tool
 * 
 * Intentionally triggers various types of errors for testing error handling.
 * Useful for validating client error handling and recovery mechanisms.
 */

import { z } from 'zod';
import type { ToolRegistration, ToolDependencies } from '@beyondbetter/bb-mcp-server';
import { toError } from '@beyondbetter/bb-mcp-server';

// Input schema
const triggerErrorInputSchema = {
  errorType: z.enum(['validation', 'runtime', 'timeout', 'custom'])
    .describe('Type of error to trigger'),
  message: z.string().optional()
    .describe('Custom error message'),
  delay: z.number().int().min(0).max(5000).optional()
    .describe('Delay before throwing error (ms)'),
} as const;



export function getTools(dependencies: ToolDependencies): ToolRegistration[] {
  const { logger } = dependencies;

  return [
    {
      name: 'trigger_error',
      definition: {
        title: 'Trigger Error',
        description: 'Intentionally trigger an error for testing error handling',
        category: 'Testing',
        inputSchema: triggerErrorInputSchema,
      },
      handler: async (args) => {
        try {
          logger.debug('Trigger error tool called', { args });

          // Apply delay if specified
          if (args.delay && args.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, args.delay));
          }

          const customMessage = args.message || `Triggered ${args.errorType} error`;

          switch (args.errorType) {
            case 'validation':
              return {
                content: [
                  {
                    type: 'text',
                    text: `Validation Error: ${customMessage}`,
                  },
                ],
                isError: true,
              };

            case 'runtime':
              throw new Error(`Runtime Error: ${customMessage}`);

            case 'timeout':
              // Simulate timeout by waiting indefinitely
              // In practice, the tool executor should have a timeout
              logger.warn('Timeout error triggered - waiting indefinitely');
              await new Promise(() => {}); // Never resolves
              break;

            case 'custom':
              return {
                content: [
                  {
                    type: 'text',
                    text: customMessage,
                  },
                ],
                isError: true,
              };

            default:
              throw new Error('Unknown error type');
          }

          // Should never reach here (except for timeout which never resolves)
          return {
            content: [
              {
                type: 'text',
                text: 'Error not triggered',
              },
            ],
          };
        } catch (error) {
          logger.error('Trigger error tool execution failed:', toError(error));
          // Re-throw for runtime errors
          throw error;
        }
      },
    },
  ];
}
