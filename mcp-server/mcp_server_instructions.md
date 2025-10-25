# MCP Server Client Inspector - Instructions for LLM

## Project Context

This is an MCP server designed to test and inspect MCP client implementations.
It provides:

1. **Inspector Tools**: Basic utilities for testing client behavior
2. **Message Tracking**: Records all MCP protocol messages for analysis
3. **Console Integration**: WebSocket endpoint for real-time monitoring
   (Phase 2)

## Architecture Overview

### Technology Stack

- **Runtime**: Deno 2.5+
- **Framework**: bb-mcp-server library (AppServer pattern)
- **Storage**: Deno KV for message history
- **Protocol**: MCP (Model Context Protocol) via @modelcontextprotocol/sdk

### Key Components

1. **main.ts**: Entry point, creates and starts AppServer
2. **dependencyHelper.ts**: Configures dependencies and plugins
3. **inspector.plugin/**: Plugin containing all inspector tools
4. **console/**: Message tracking and types (WebSocket in Phase 2)

## Development Guidelines

### Adding New Tools

To add a new inspector tool:

1. Create tool file: `src/plugins/inspector.plugin/tools/myTool.ts`
2. Follow the pattern:
   ```typescript
   import { z } from 'zod';
   import type { ToolConfig } from '@beyondbetter/bb-mcp-server';

   const myToolInputSchema = {
     param1: z.string().describe('Description'),
   } as const;

   type MyToolArgs = { param1: string };

   export function getTools(dependencies: any): ToolConfig<any>[] {
     const { logger } = dependencies;
     return [{
       name: 'my_tool',
       definition: {
         title: 'My Tool',
         description: 'What it does',
         category: 'Testing',
         inputSchema: myToolInputSchema,
       },
       handler: async (args: MyToolArgs) => {
         logger.debug('My tool called', { args });
         return {
           content: [{ type: 'text', text: 'Result' }],
         };
       },
     }];
   }
   ```
3. Import in `plugin.ts` and add to `allTools` array

### Running the Server

```bash
# STDIO mode (for MCP client testing)
cd mcp-server
deno task dev

# HTTP mode (for web-based testing)
MCP_TRANSPORT=http deno task dev
```

### Environment Variables

Key configuration (see `.env.example`):

- `MCP_TRANSPORT`: stdio or http
- `HTTP_PORT`: HTTP server port (default: 3000)
- `LOG_LEVEL`: debug, info, warn, error
- `MESSAGE_HISTORY_LIMIT`: Max messages per session
- `STORAGE_DENO_KV_PATH`: KV database location

## Testing Approach

### Manual Testing

1. Start server with `deno task dev`
2. Connect MCP client to test
3. Call inspector tools
4. Verify responses and behavior

### Automated Testing (Future)

Tests will be in `tests/` directory:

- `tests/tools/`: Unit tests for each tool
- `tests/console/`: Integration tests for message tracking
- `tests/integration/`: End-to-end tests

## Phase Status

### Phase 1 (Current) - COMPLETE

- ✅ Project structure and configuration
- ✅ MCP server core (main.ts, dependencyHelper.ts)
- ✅ Inspector plugin with 6 tools
- ✅ Message tracking infrastructure
- ⏸️ Tests deferred to later

### Phase 2 (Next)

- WebSocket console integration
- Real-time message broadcasting
- Sampling and elicitation support
- Fresh UI development

## Common Issues

### Import Errors

- Ensure using Deno 2.5+
- Check `deno.json` imports are correct
- Use `deno check` to verify types

### KV Storage

- Database file created at `STORAGE_DENO_KV_PATH`
- Requires `--unstable-kv` flag
- Clear data by deleting the database file

### Plugin Discovery

- Plugins must be in `src/plugins/` directory
- Plugin must export default object with `AppPlugin` interface
- Check logs for plugin loading messages

## References

- Project docs: `/docs` directory
- bb-mcp-server: https://jsr.io/@beyondbetter/bb-mcp-server
- MCP Protocol: https://modelcontextprotocol.io
