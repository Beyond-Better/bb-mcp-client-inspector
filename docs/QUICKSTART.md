# Quick Start Guide - MCP Client Inspector Server

## Prerequisites

- **Deno 2.5+**: Install from https://deno.land
- **MCP Client**: Any MCP client implementation to test

## Installation

```bash
# Clone the repository (or navigate to it)
cd bb-mcp-server-client-inspector/mcp-server

# Copy environment file
cp .env.example .env

# (Optional) Edit .env to customize settings
```

## Running the Server

### Option 1: STDIO Mode (Default)

Perfect for testing with MCP clients that use STDIO transport:

```bash
deno task dev
```

The server will start and wait for STDIO input/output.

### Option 2: HTTP Mode

Use when testing with HTTP-based MCP clients or for web console access:

```bash
MCP_TRANSPORT=http deno task dev
```

Server will be available at:
- MCP endpoint: `http://localhost:3000/mcp`
- WebSocket console: `ws://localhost:3000/ws/console` (Phase 2)

## Testing the Server

### Using MCP Inspector (Recommended)

```bash
# In another terminal
npx @modelcontextprotocol/inspector deno task start
```

This opens a web interface to test the server.

### Available Tools

Once connected, try these tools:

#### 1. Echo Tool
```json
{
  "name": "echo",
  "arguments": {
    "message": "Hello, MCP!",
    "uppercase": true
  }
}
```

#### 2. Calculate Tool
```json
{
  "name": "calculate",
  "arguments": {
    "operation": "add",
    "a": 10,
    "b": 5
  }
}
```

#### 3. Convert Date Tool
```json
{
  "name": "convert_date",
  "arguments": {
    "date": "2025-10-22T07:00:00Z",
    "format": "human",
    "toTimezone": "America/New_York"
  }
}
```

#### 4. Delay Response Tool
```json
{
  "name": "delay_response",
  "arguments": {
    "delay": 2000,
    "message": "Testing timeout handling"
  }
}
```

#### 5. Random Data Tool
```json
{
  "name": "random_data",
  "arguments": {
    "type": "object",
    "count": 3,
    "seed": 42
  }
}
```

#### 6. Trigger Error Tool
```json
{
  "name": "trigger_error",
  "arguments": {
    "errorType": "validation",
    "message": "Custom error message"
  }
}
```

## Configuration

Edit `.env` file to customize:

```bash
# Transport mode
MCP_TRANSPORT=http          # or stdio

# HTTP settings (if using http transport)
HTTP_PORT=3000
HTTP_HOST=localhost

# Message tracking
MESSAGE_HISTORY_LIMIT=1000
MESSAGE_HISTORY_RETENTION_DAYS=7

# Logging
LOG_LEVEL=info              # debug, info, warn, error
LOG_FORMAT=text             # text or json

# Storage
STORAGE_DENO_KV_PATH=./data/inspector.db
```

## Troubleshooting

### Server won't start

1. Check Deno version: `deno --version` (needs 2.5+)
2. Check for port conflicts if using HTTP mode
3. Check logs for error messages

### Tools not appearing

1. Check plugin loading in logs
2. Verify `src/plugins/inspector.plugin/` exists
3. Check file permissions

### Message tracking not working

1. Ensure `--unstable-kv` flag is present (in deno.json tasks)
2. Check `STORAGE_DENO_KV_PATH` is writable
3. Clear database file to reset: `rm data/inspector.db*`

## Next Steps

1. **Connect your MCP client** to test its implementation
2. **Review message history** using the console (Phase 2)
3. **Add custom tools** by following patterns in `src/plugins/inspector.plugin/tools/`
4. **Explore the API** using MCP Inspector or your own client

## Support

- Documentation: `/docs` directory in project root
- Issues: GitHub repository issues
- MCP Protocol: https://modelcontextprotocol.io
