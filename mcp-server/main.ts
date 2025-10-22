#!/usr/bin/env -S deno run --allow-all --unstable-kv

/**
 * MCP Server Client Inspector
 * 
 * An MCP server for testing and inspecting MCP client implementations.
 * Provides basic tools and console integration for testing sampling,
 * elicitation, and notification handling.
 */

import { AppServer } from '@beyondbetter/bb-mcp-server';
import { createInspectorDependencies } from './src/dependencyHelper.ts';

async function main(): Promise<void> {
  try {
    console.log('🔍 Starting MCP Client Inspector Server...');
    
    // Create AppServer with inspector dependencies
    const appServer = await AppServer.create(createInspectorDependencies);
    
    // Start the server
    await appServer.start();
    
    const transport = Deno.env.get('MCP_TRANSPORT') || 'stdio';
    const port = Deno.env.get('HTTP_PORT') || '3000';
    
    console.log('✅ MCP Client Inspector Server started successfully!');
    console.log(`📡 Transport: ${transport}`);
    
    if (transport === 'http') {
      console.log(`🌐 HTTP endpoint: http://localhost:${port}/mcp`);
      console.log(`🔌 WebSocket console: ws://localhost:${port}/ws/console`);
    }
    
    console.log('🛠️  Inspector tools loaded:');
    console.log('   - echo');
    console.log('   - convert_date');
    console.log('   - calculate');
    console.log('   - delay_response');
    console.log('   - random_data');
    console.log('   - trigger_error');
    
  } catch (error) {
    console.error('❌ Failed to start MCP Client Inspector Server:', error);
    Deno.exit(1);
  }
}

// Handle clean shutdown
Deno.addSignalListener('SIGINT', () => {
  console.log('\n🛑 Shutting down MCP Client Inspector Server...');
  Deno.exit(0);
});

if (import.meta.main) {
  main();
}
