#!/usr/bin/env -S deno run --allow-all --unstable-kv

/**
 * MCP Server Client Inspector
 *
 * An MCP server for testing and inspecting MCP client implementations.
 * Provides basic tools and console integration for testing sampling,
 * elicitation, and notification handling.
 *
 * @module
 */

import { AppServer, Logger } from '@beyondbetter/bb-mcp-server';
import { createInspectorDependencies } from './src/dependencyHelper.ts';

async function main(): Promise<void> {
  try {
    const tempLogger = new Logger();
    tempLogger.info('InspectorApp: 🔍 Starting MCP Client Inspector Server...');

    // Create AppServer with inspector dependencies
    const appServer = await AppServer.create(createInspectorDependencies);
    const logger = appServer.logger;

    // Start the server
    await appServer.start();

    const transport = Deno.env.get('MCP_TRANSPORT') || 'stdio';
    const port = Deno.env.get('HTTP_PORT') || '3000';

    logger.info(
      'InspectorApp: ✅ MCP Client Inspector Server started successfully!',
    );

    logger.info('InspectorApp: 🛠️  Inspector tools loaded:', [
      'echo',
      'convert_date',
      'calculate',
      'delay_response',
      'random_data',
      'trigger_error',
    ]);

    logger.info(`InspectorApp: 📡 Transport: ${transport}`);

    if (transport === 'http') {
      logger.info(
        `InspectorApp: 🌐 HTTP endpoint: http://localhost:${port}/mcp`,
      );
      logger.info(
        `InspectorApp: 🔌 WebSocket console: ws://localhost:${port}/ws/console`,
      );
    }
  } catch (error) {
    console.error(
      'InspectorApp: ❌ Failed to start MCP Client Inspector Server:',
      error,
    );
    Deno.exit(1);
  }
}

// Handle clean shutdown
Deno.addSignalListener('SIGINT', () => {
  const tempLogger = new Logger();
  tempLogger.info(
    'InspectorApp: 🛑 Shutting down MCP Client Inspector Server...',
  );
  Deno.exit(0);
});

if (import.meta.main) {
  main();
}
