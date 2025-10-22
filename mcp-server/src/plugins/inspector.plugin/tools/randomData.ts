/**
 * Random Data Tool
 * 
 * Generates random test data of various types.
 * Useful for testing data handling and generating test scenarios.
 */

import { z } from 'zod';
import type { ToolRegistration, ToolDependencies } from '@beyondbetter/bb-mcp-server';
import { toError } from '@beyondbetter/bb-mcp-server';

// Input schema
const randomDataInputSchema = {
  type: z.enum(['number', 'string', 'boolean', 'array', 'object'])
    .describe('Type of random data to generate'),
  count: z.number().int().min(1).max(100).default(1)
    .describe('Number of items to generate (for arrays)'),
  seed: z.number().optional()
    .describe('Random seed for reproducible results'),
} as const;



/**
 * Simple seeded random number generator
 * Uses a linear congruential generator for reproducible randomness
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

export function getTools(dependencies: ToolDependencies): ToolRegistration[] {
  const { logger } = dependencies;

  return [
    {
      name: 'random_data',
      definition: {
        title: 'Random Data',
        description: 'Generate random test data',
        category: 'Testing',
        inputSchema: randomDataInputSchema,
      },
      handler: async (args) => {
        try {
          logger.debug('Random data tool called', { args });

          // Use seeded random if seed provided, otherwise use Math.random
          const random = args.seed !== undefined 
            ? seededRandom(args.seed)
            : Math.random;

          let result: unknown;
          const count = args.count || 1;

          switch (args.type) {
            case 'number':
              result = Array.from({ length: count }, () => 
                Math.floor(random() * 1000)
              );
              break;

            case 'string':
              result = Array.from({ length: count }, (_, i) => 
                `test_string_${i}_${Math.random().toString(36).substring(7)}`
              );
              break;

            case 'boolean':
              result = Array.from({ length: count }, () => random() > 0.5);
              break;

            case 'array':
              result = Array.from({ length: count }, (_, i) => 
                Array.from({ length: 3 }, (_, j) => `item_${i}_${j}`)
              );
              break;

            case 'object':
              result = Array.from({ length: count }, (_, i) => ({
                id: i,
                name: `Object ${i}`,
                value: Math.floor(random() * 100),
                active: random() > 0.5,
              }));
              break;

            default:
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Invalid data type',
                  },
                ],
                isError: true,
              };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  type: args.type,
                  count,
                  seed: args.seed,
                  data: result,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          logger.error('Random data tool failed:', toError(error));
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
