/**
 * Dependency Helper for Inspector MCP Server
 *
 * Creates and configures all dependencies for the inspector server.
 * Follows the bb-mcp-server pattern for dependency injection.
 */

import { dirname, relative, resolve } from "@std/path";
import type {
  AppServerDependencies,
  BeyondMcpServer,
  CreateCustomAppServerDependencies,
  CustomEndpoint,
  PluginManagerConfig,
} from "@beyondbetter/bb-mcp-server";
import { MessageTracker } from "./console/MessageTracker.ts";
import { VERSION } from "@shared/version.ts";
import { ConsoleManager } from "./console/ConsoleManager.ts";

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

  logger.info(
    "InspectorDependencyHelper: 🔧 Initializing MCP Client Inspector dependencies...",
  );

  // Initialize message tracker with KV storage
  const kv = await kvManager.getKV();
  const messageTracker = new MessageTracker(kv, logger);
  logger.info("InspectorDependencyHelper: 📊 MessageTracker initialized");

  // Note: ConsoleManager will be initialized after beyondMcpServer is created
  // We'll return it as part of dependencies and it will be created by the library
  //let consoleManager: ConsoleManager | undefined;
  const consoleManager = new ConsoleManager(
    messageTracker,
    logger,
  );

  logger.info(
    "InspectorDependencyHelper: 🔌 ConsoleManager will be initialized post-dependency resolution",
  );

  // Get current module's directory and resolve plugin path relative to CWD
  const moduleDir = dirname(new URL(import.meta.url).pathname);
  const pluginPath = relative(Deno.cwd(), resolve(moduleDir, "./plugins"));

  // Configure plugin discovery
  const pluginManagerConfig = configManager.get<PluginManagerConfig>(
    "pluginManager",
  );
  const existingPaths = pluginManagerConfig.paths || [];

  // Normalize paths and check for duplicates
  const normalizedPluginPath = pluginPath.replace(/\\/g, "/");
  const normalizedExistingPaths = existingPaths.map((p: string) =>
    p.replace(/\\/g, "/")
  );

  // Add plugin path only if not already present
  if (!normalizedExistingPaths.includes(normalizedPluginPath)) {
    configManager.set("pluginManager.paths", [
      normalizedPluginPath,
      ...existingPaths,
    ]);
    logger.info(
      `InspectorDependencyHelper: 📦 Plugin discovery path: ${normalizedPluginPath}`,
    );
  }

  const dependencies: Partial<AppServerDependencies> = {
    // Library dependencies (from bb-mcp-server)
    configManager,
    logger,
    kvManager,

    // Inspector-specific dependencies
    messageTracker,
    consoleManager,
    customEndpoints: [
      {
        path: "/ws/console",
        handle: async (
          request: Request,
          dependencies: { beyondMcpServer: BeyondMcpServer },
        ) => {
          logger.info("InspectorDependencyHelper: 🔌 ConsoleManager handler");
          return await consoleManager.handle(request, dependencies);
        },
      },
    ],

    // Server configuration
    serverConfig: {
      name: "mcp-client-inspector",
      version: VERSION,
      title: "MCP Client Inspector",
      description:
        "MCP server for testing and inspecting MCP client implementations",
    },
  };

  // Custom endpoints for WebSocket console
  logger.info(
    "InspectorDependencyHelper: Inspector dependencies: customEndpoints:",
    dependencies.customEndpoints.map((e: CustomEndpoint) => ({
      path: e.path,
      hasHandler: typeof e.handle === "function",
    })),
  );

  logger.info(
    "InspectorDependencyHelper: ✅ Inspector dependencies initialized",
  );

  return dependencies;
}
