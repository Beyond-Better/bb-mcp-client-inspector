#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env --allow-run
/**
 * MCP Client Inspector - Main Entry Point
 *
 * This is the primary entry point that launches both the MCP Server and Fresh UI
 * components simultaneously. Both servers will run in parallel, allowing you to
 * test MCP clients through the web console.
 *
 * @module
 */

import { parseArgs } from '@std/cli';
import { VERSION } from '@shared/version.ts';

const HELP = `
MCP Client Inspector v${VERSION}

Usage:
  deno run jsr:@beyondbetter/mcp-client-inspector [options]

Options:
  --mcp-port <port>      Port for MCP server (default: 3000)
  --ui-port <port>       Port for Fresh UI (default: 8000)
  --mcp-host <host>      Host for MCP server (default: localhost)
  --ui-host <host>       Host for Fresh UI (default: localhost)
  --help, -h             Show this help message

Examples:
  # Run with default settings
  deno run jsr:@beyondbetter/mcp-client-inspector

  # Run with custom ports
  deno run jsr:@beyondbetter/mcp-client-inspector --mcp-port 3001 --ui-port 8080

  # Run only MCP server
  deno run jsr:@beyondbetter/mcp-client-inspector/mcp-server

  # Run only Fresh UI
  deno run jsr:@beyondbetter/mcp-client-inspector/fresh-ui

Documentation: https://github.com/Beyond-Better/bb-mcp-client-inspector
`;

interface LaunchOptions {
  mcpPort: number;
  uiPort: number;
  mcpHost: string;
  uiHost: string;
}

function parseArguments(): LaunchOptions | null {
  const args = parseArgs(Deno.args, {
    string: ['mcp-port', 'ui-port', 'mcp-host', 'ui-host'],
    boolean: ['help', 'h'],
    default: {
      'mcp-port': '3000',
      'ui-port': '8000',
      'mcp-host': 'localhost',
      'ui-host': 'localhost',
    },
  });

  if (args.help || args.h) {
    console.log(HELP);
    return null;
  }

  return {
    mcpPort: parseInt(args['mcp-port'], 10),
    uiPort: parseInt(args['ui-port'], 10),
    mcpHost: args['mcp-host'],
    uiHost: args['ui-host'],
  };
}

async function launchMcpServer(
  options: LaunchOptions,
): Promise<Deno.ChildProcess> {
  console.log(
    `🚀 Starting MCP Server on ${options.mcpHost}:${options.mcpPort}...`,
  );

  const command = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-net',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      new URL('./mcp-server/main.ts', import.meta.url).pathname,
    ],
    env: {
      ...Deno.env.toObject(),
      MCP_SERVER_PORT: options.mcpPort.toString(),
      MCP_SERVER_HOST: options.mcpHost,
    },
    stdout: 'inherit',
    stderr: 'inherit',
  });

  return command.spawn();
}

async function launchFreshUi(
  options: LaunchOptions,
): Promise<Deno.ChildProcess> {
  console.log(`🎨 Starting Fresh UI on ${options.uiHost}:${options.uiPort}...`);

  const command = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-net',
      '--allow-read',
      '--allow-env',
      new URL('./fresh-ui/main.ts', import.meta.url).pathname,
    ],
    env: {
      ...Deno.env.toObject(),
      PORT: options.uiPort.toString(),
      HOST: options.uiHost,
      MCP_SERVER_URL: `http://${options.mcpHost}:${options.mcpPort}`,
    },
    stdout: 'inherit',
    stderr: 'inherit',
  });

  return command.spawn();
}

async function main() {
  const options = parseArguments();
  if (!options) {
    Deno.exit(0);
  }

  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│   MCP Client Inspector                  │');
  console.log('│   Testing platform for MCP clients      │');
  console.log('└─────────────────────────────────────────┘\n');

  let mcpProcess: Deno.ChildProcess | null = null;
  let uiProcess: Deno.ChildProcess | null = null;

  try {
    // Launch both components
    mcpProcess = await launchMcpServer(options);
    uiProcess = await launchFreshUi(options);

    console.log('\n✅ Both components started successfully!\n');
    console.log(`📊 Web Console: http://${options.uiHost}:${options.uiPort}`);
    console.log(`🔌 MCP Server:  http://${options.mcpHost}:${options.mcpPort}`);
    console.log('\nPress Ctrl+C to stop both servers\n');

    // Wait for either process to exit
    await Promise.race([
      mcpProcess.status,
      uiProcess.status,
    ]);
  } catch (error) {
    console.error('❌ Error launching components:', error);
    Deno.exit(1);
  } finally {
    // Cleanup: terminate both processes
    if (mcpProcess) {
      try {
        mcpProcess.kill('SIGTERM');
      } catch {
        // Process may already be terminated
      }
    }
    if (uiProcess) {
      try {
        uiProcess.kill('SIGTERM');
      } catch {
        // Process may already be terminated
      }
    }
  }
}

if (import.meta.main) {
  main();
}
