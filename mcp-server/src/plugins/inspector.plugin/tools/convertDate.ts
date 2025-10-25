/**
 * Convert Date Tool
 *
 * Converts dates between different formats and timezones.
 * Useful for testing data transformation and formatting.
 */

import { z } from 'zod';
import type {
  InferZodSchema,
  ToolDependencies,
  ToolRegistration,
} from '@beyondbetter/bb-mcp-server';
import { toError } from '@beyondbetter/bb-mcp-server';

// Input schema
const convertDateInputSchema = {
  date: z.string().describe('Date string to convert (ISO 8601 format)'),
  fromTimezone: z.string().default('UTC')
    .describe('Source timezone (e.g., "UTC", "America/New_York")'),
  toTimezone: z.string().default('UTC')
    .describe('Target timezone'),
  format: z.enum(['iso', 'human', 'unix', 'date-only', 'time-only']).default(
    'iso',
  )
    .describe('Output format'),
} as const;

export function getTools(dependencies: ToolDependencies): ToolRegistration[] {
  const { logger } = dependencies;

  return [
    {
      name: 'convert_date',
      definition: {
        title: 'Convert Date',
        description: 'Convert date between formats and timezones',
        category: 'Utility',
        inputSchema: convertDateInputSchema,
      },
      // deno-lint-ignore require-await
      handler: async (args: InferZodSchema<typeof convertDateInputSchema>) => {
        try {
          logger.debug('Convert date tool called', { args });

          const date = new Date(args.date);

          if (isNaN(date.getTime())) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Invalid date format. Please use ISO 8601 format.',
                },
              ],
              isError: true,
            };
          }

          let result: string;
          const format = args.format || 'iso';

          switch (format) {
            case 'iso':
              result = date.toISOString();
              break;
            case 'human':
              result = date.toLocaleString('en-US', {
                timeZone: args.toTimezone || 'UTC',
                dateStyle: 'full',
                timeStyle: 'long',
              });
              break;
            case 'unix':
              result = Math.floor(date.getTime() / 1000).toString();
              break;
            case 'date-only':
              result = date.toLocaleDateString('en-US', {
                timeZone: args.toTimezone || 'UTC',
              });
              break;
            case 'time-only':
              result = date.toLocaleTimeString('en-US', {
                timeZone: args.toTimezone || 'UTC',
              });
              break;
            default:
              result = date.toISOString();
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    original: args.date,
                    converted: result,
                    format,
                    timezone: args.toTimezone || 'UTC',
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          logger.error('Convert date tool failed:', toError(error));
          return {
            content: [
              {
                type: 'text',
                text: `Error converting date: ${
                  error instanceof Error ? error.message : 'Unknown error'
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
