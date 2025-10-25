/**
 * MCP Protocol Message Fixtures
 *
 * Sample MCP protocol messages for testing.
 */

import type { McpMessage } from '@shared/types/index.ts';

/**
 * Sample tool call request
 */
export const toolCallRequest: McpMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'echo',
    arguments: {
      message: 'Hello, World!',
    },
  },
};

/**
 * Sample tool call response
 */
export const toolCallResponse: McpMessage = {
  jsonrpc: '2.0',
  id: 1,
  result: {
    content: [
      {
        type: 'text',
        text: 'Hello, World!',
      },
    ],
  },
};

/**
 * Sample tools/list request
 */
export const toolsListRequest: McpMessage = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
};

/**
 * Sample tools/list response
 */
export const toolsListResponse: McpMessage = {
  jsonrpc: '2.0',
  id: 2,
  result: {
    tools: [
      {
        name: 'echo',
        description: 'Echo back the provided message',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message to echo back',
            },
          },
          required: ['message'],
        },
      },
    ],
  },
};

/**
 * Sample notification
 */
export const notificationMessage: McpMessage = {
  jsonrpc: '2.0',
  method: 'notifications/message',
  params: {
    level: 'info',
    logger: 'test',
    data: 'Test notification',
  },
};

/**
 * Sample error response
 */
export const errorResponse: McpMessage = {
  jsonrpc: '2.0',
  id: 3,
  error: {
    code: -32600,
    message: 'Invalid Request',
    data: {
      details: 'Missing required parameter',
    },
  },
};

/**
 * Sample sampling request (createMessage)
 */
export const samplingRequest: McpMessage = {
  jsonrpc: '2.0',
  id: 4,
  method: 'sampling/createMessage',
  params: {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'What is 2+2?',
        },
      },
    ],
    maxTokens: 100,
  },
};

/**
 * Sample sampling response
 */
export const samplingResponse: McpMessage = {
  jsonrpc: '2.0',
  id: 4,
  result: {
    content: {
      type: 'text',
      text: '2+2 equals 4.',
    },
    model: 'test-model',
    stopReason: 'endTurn',
  },
};

/**
 * Sample elicitation request
 */
export const elicitationRequest: McpMessage = {
  jsonrpc: '2.0',
  id: 5,
  method: 'elicitation/request',
  params: {
    message: 'Please confirm the action',
    requestedSchema: {
      type: 'object',
      properties: {
        confirmed: {
          type: 'boolean',
          description: 'User confirmation',
        },
      },
    },
  },
};

/**
 * Sample elicitation response (accept)
 */
export const elicitationResponseAccept: McpMessage = {
  jsonrpc: '2.0',
  id: 5,
  result: {
    action: 'accept',
    content: {
      confirmed: true,
    },
  },
};

/**
 * Sample elicitation response (decline)
 */
export const elicitationResponseDecline: McpMessage = {
  jsonrpc: '2.0',
  id: 5,
  result: {
    action: 'decline',
  },
};
