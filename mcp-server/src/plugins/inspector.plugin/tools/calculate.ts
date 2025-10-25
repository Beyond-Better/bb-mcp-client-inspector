/**
 * Calculate Tool
 *
 * Performs basic arithmetic calculations.
 * Useful for testing numeric data handling and parameter validation.
 */

import { z } from 'zod';
import type {
  InferZodSchema,
  ToolDependencies,
  ToolRegistration,
} from '@beyondbetter/bb-mcp-server';
import { toError } from '@beyondbetter/bb-mcp-server';

// Input schema
const calculateInputSchema = {
  operation: z.enum([
    'add',
    'subtract',
    'multiply',
    'divide',
    'power',
    'modulo',
  ])
    .describe('Arithmetic operation to perform'),
  a: z.number().describe('First operand'),
  b: z.number().describe('Second operand'),
} as const;

export function getTools(dependencies: ToolDependencies): ToolRegistration[] {
  const { logger } = dependencies;

  return [
    {
      name: 'calculate',
      definition: {
        title: 'Calculate',
        description: 'Perform basic arithmetic calculations',
        category: 'Utility',
        inputSchema: calculateInputSchema,
      },
      // deno-lint-ignore require-await
      handler: async (args: InferZodSchema<typeof calculateInputSchema>) => {
        try {
          logger.debug('Calculate tool called', { args });

          let result: number;

          switch (args.operation) {
            case 'add':
              result = args.a + args.b;
              break;
            case 'subtract':
              result = args.a - args.b;
              break;
            case 'multiply':
              result = args.a * args.b;
              break;
            case 'divide':
              if (args.b === 0) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: 'Error: Division by zero',
                    },
                  ],
                  isError: true,
                };
              }
              result = args.a / args.b;
              break;
            case 'power':
              result = Math.pow(args.a, args.b);
              break;
            case 'modulo':
              result = args.a % args.b;
              break;
            default:
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Invalid operation',
                  },
                ],
                isError: true,
              };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    operation: args.operation,
                    operands: [args.a, args.b],
                    result,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          logger.error('Calculate tool failed:', toError(error));
          return {
            content: [
              {
                type: 'text',
                text: `Calculation error: ${
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
