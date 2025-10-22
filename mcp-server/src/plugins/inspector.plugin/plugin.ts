/**
 * Inspector Plugin
 * 
 * Provides testing and utility tools for inspecting MCP client implementations.
 * Includes tools for testing sampling, elicitation, error handling, and basic utilities.
 */

import type {
  AppPlugin,
  ToolRegistration,
  ToolRegistry,
  WorkflowBase,
  WorkflowRegistry,
} from '@beyondbetter/bb-mcp-server';

import { getTools as getEchoTools } from './tools/echo.ts';
import { getTools as getConvertDateTools } from './tools/convertDate.ts';
import { getTools as getCalculateTools } from './tools/calculate.ts';
import { getTools as getDelayResponseTools } from './tools/delayResponse.ts';
import { getTools as getRandomDataTools } from './tools/randomData.ts';
import { getTools as getTriggerErrorTools } from './tools/triggerError.ts';

export default {
  name: 'inspector',
  version: '1.0.0',
  description: 'Inspector tools for testing MCP client implementations',

  workflows: [] as WorkflowBase[],
  tools: [] as ToolRegistration[],

  async initialize(
    dependencies: any,
    toolRegistry: ToolRegistry,
    workflowRegistry: WorkflowRegistry,
  ): Promise<void> {
    const logger = dependencies.logger;

    // Collect all tools from the tool modules
    const allTools = [
      ...getEchoTools(dependencies),
      ...getConvertDateTools(dependencies),
      ...getCalculateTools(dependencies),
      ...getDelayResponseTools(dependencies),
      ...getRandomDataTools(dependencies),
      ...getTriggerErrorTools(dependencies),
    ];

    // Register all tools with the tool registry
    for (const tool of allTools) {
      toolRegistry.registerTool(
        tool.name,
        tool.definition,
        tool.handler,
        tool.options,
      );
    }

    logger.info('Inspector plugin initialized with tools:', {
      toolCount: allTools.length,
      tools: allTools.map(t => t.name),
    });
  },
} as AppPlugin;
