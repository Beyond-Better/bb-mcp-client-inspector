/**
 * Dependency Helper for Inspector MCP Server
 * 
 * Creates and configures all dependencies for the inspector server.
 * Follows the bb-mcp-server pattern for dependency injection.
 */

import { dirname, relative, resolve } from '@std/path';
import type {
  AppServerDependencies,
  CreateCustomAppServerDependencies,
  PluginManagerConfig,
} from '@beyondbetter/bb-mcp-server';
import { MessageTracker } from './console/MessageTracker.ts';
import { ConsoleManager } from './console/ConsoleManager.ts';

/**
 * Create dependencies for the Inspector MCP Server
 * 
 * This function sets up all necessary dependencies including:
 * - Server configuration
 * - Plugin discovery paths
 * - Console manager initialization (future)
 * 
 * @returns Partial dependencies with inspector configuration
 */
export async function createInspectorDependencies(
  appDependencies: CreateCustomAppServerDependencies,
): Promise<Partial<AppServerDependencies>> {
  const { configManager, logger, kvManager } = appDependencies;

  logger.info('🔧 Initializing MCP Client Inspector dependencies...');

  // Initialize message tracker with KV storage
  const kv = await kvManager.getKV();
  const messageTracker = new MessageTracker(kv, logger);
  logger.info('📊 MessageTracker initialized');

  // Note: ConsoleManager will be initialized after beyondMcpServer is created
  // We'll return it as part of dependencies and it will be created by the library
  let consoleManager: ConsoleManager | undefined;
  
  logger.info('🔌 ConsoleManager will be initialized post-dependency resolution');

  // Get current module's directory and resolve plugin path relative to CWD
  const moduleDir = dirname(new URL(import.meta.url).pathname);
  const pluginPath = relative(Deno.cwd(), resolve(moduleDir, './plugins'));

  // Configure plugin discovery
  const pluginManagerConfig = configManager.get<PluginManagerConfig>('pluginManager');
  const existingPaths = pluginManagerConfig.paths || [];

  // Normalize paths and check for duplicates
  const normalizedPluginPath = pluginPath.replace(/\\/g, '/');
  const normalizedExistingPaths = existingPaths.map((p: string) => p.replace(/\\/g, '/'));

  // Add plugin path only if not already present
  if (!normalizedExistingPaths.includes(normalizedPluginPath)) {
    configManager.set('pluginManager.paths', [normalizedPluginPath, ...existingPaths]);
    logger.info(`📦 Plugin discovery path: ${normalizedPluginPath}`);
  }

  const dependencies: Partial<AppServerDependencies> = {
    // Library dependencies (from bb-mcp-server)
    configManager,
    logger,
    kvManager,

    // Inspector-specific dependencies
    messageTracker,

    // Custom endpoints for WebSocket console
    // Note: Handler uses closure to access beyondMcpServer after it's created
    customEndpoints: [
      {
        path: '/ws/console',
        handle: async (request: Request) => {
          // Lazy initialization of ConsoleManager on first request
          if (!consoleManager) {
            // Get beyondMcpServer from dependencies (it's created by now)
            const beyondMcpServer = (dependencies as any).beyondMcpServer;
            if (!beyondMcpServer) {
              logger.error('beyondMcpServer not available for ConsoleManager');
              return new Response('Server not ready', { status: 503 });
            }
            consoleManager = new ConsoleManager(beyondMcpServer, messageTracker, logger);
            logger.info('🔌 ConsoleManager initialized (lazy)');
          }
          return await consoleManager.handle(request);
        },
      },
    ],

    // Server configuration
    serverConfig: {
      name: 'mcp-client-inspector',
      version: '1.0.0',
      title: 'MCP Client Inspector',
      description: 'MCP server for testing and inspecting MCP client implementations',
    },
  };

  // Store consoleManager reference in dependencies for access by custom endpoint
  (dependencies as any).consoleManager = consoleManager;

  logger.info('✅ Inspector dependencies initialized');

  return dependencies;
}
