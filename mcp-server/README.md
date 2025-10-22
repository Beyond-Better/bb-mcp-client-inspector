# MCP Server Client Inspector - MCP Server

This is the MCP server component of the MCP Client Inspector. It provides
inspector tools and console integration for testing MCP client implementations.

## Quick Start

### Prerequisites

- Deno 2.5+

### Installation

```bash
cd mcp-server
cp .env.example .env
```

### Development

```bash
# Start with STDIO transport (default)
deno task dev

# Start with HTTP transport
MCP_TRANSPORT=http deno task dev
```

### Available Tools

#### Testing Tools

- **echo**: Echo back messages with optional delay and transformations
- **delay_response**: Test timeout handling with configurable delays
- **random_data**: Generate random test data
- **trigger_error**: Intentionally trigger errors for testing

#### Utility Tools

- **convert_date**: Convert dates between formats and timezones
- **calculate**: Perform basic arithmetic operations

## Architecture

The server consists of:

1. **Inspector Plugin**: Provides basic testing tools
2. **Console Manager**: WebSocket endpoint for UI integration (`/ws/console`)
3. **Message Tracker**: Tracks and stores MCP protocol messages

### WebSocket Console

The server provides a WebSocket endpoint at `/ws/console` for real-time console
integration:

- Real-time message broadcasting
- Command handling (notifications, sampling, elicitation)
- Client tracking and session management
- Message history access

## Configuration

See `.env.example` for all available configuration options.

### Key Settings

- `MCP_TRANSPORT`: Transport mode (stdio or http)
- `HTTP_PORT`: HTTP server port (default: 3000)
- `CONSOLE_WS_PATH`: WebSocket endpoint path
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## Testing

```bash
# Run all tests
deno task test

# Watch mode
deno task test:watch
```

## Documentation

See the `/docs` directory in the project root for complete documentation.
