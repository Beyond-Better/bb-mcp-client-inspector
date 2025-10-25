# Installation Guide

## From JSR (Recommended)

The MCP Client Inspector is published to JSR and can be run directly without
installation.

### Run Both Components

The default export runs both the MCP Server and Web UI simultaneously:

```bash
deno run -A jsr:@beyondbetter/mcp-client-inspector
```

This will start:

- **MCP Server** on `http://localhost:3000`
- **Web UI** on `http://localhost:8000`

### Run with Custom Ports

```bash
deno run -A jsr:@beyondbetter/mcp-client-inspector --mcp-port 3001 --ui-port 8080
```

Available options:

- `--mcp-port <port>` - Port for MCP server (default: 3000)
- `--ui-port <port>` - Port for Fresh UI (default: 8000)
- `--mcp-host <host>` - Host for MCP server (default: localhost)
- `--ui-host <host>` - Host for Fresh UI (default: localhost)
- `--help, -h` - Show help message

### Run Individual Components

You can also run just the MCP server or just the Web UI:

```bash
# Run only the MCP server
deno run -A jsr:@beyondbetter/mcp-client-inspector/mcp-server

# Run only the Web UI
deno run -A jsr:@beyondbetter/mcp-client-inspector/fresh-ui
```

## From Source

For development or customization, clone and run locally:

### Clone the Repository

```bash
git clone https://github.com/Beyond-Better/bb-mcp-client-inspector.git
cd bb-mcp-client-inspector
```

### Run Both Components

```bash
# Production mode
deno task start

# Development mode with hot reload
deno task dev
```

### Run Individual Components

```bash
# MCP Server only
deno task start:mcp  # Production
deno task dev:mcp    # Development

# Web UI only
deno task start:ui   # Production
deno task dev:ui     # Development
```

### Environment Configuration

Both components can be configured via environment variables. Copy the example
files:

```bash
# MCP Server configuration
cp mcp-server/.env.example mcp-server/.env

# Web UI configuration
cp fresh-ui/.env.example fresh-ui/.env
```

Edit the `.env` files to customize:

**MCP Server (`mcp-server/.env`)**:

```bash
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost
LOG_LEVEL=info
# ... other options
```

**Web UI (`fresh-ui/.env`)**:

```bash
PORT=8000
HOST=localhost
MCP_SERVER_URL=http://localhost:3000
```

## Prerequisites

- **Deno 2.5+** - [Install Deno](https://deno.land/#installation)
- No other dependencies required!

## Verifying Installation

After starting the servers, verify they're running:

1. Open your browser to `http://localhost:8000` (or your custom UI port)
2. You should see the MCP Client Inspector web console
3. The console should show "Connected" status

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error, either:

1. Stop the process using that port
2. Use custom ports with `--mcp-port` and `--ui-port` flags

### Connection Failed

If the Web UI can't connect to the MCP Server:

1. Verify the MCP Server is running
2. Check that ports match in both components
3. Check your firewall settings
4. Ensure both are running on compatible host/port combinations

### Permission Errors

The `-A` flag grants all permissions. For production use, you can be more
specific:

```bash
deno run \
  --allow-net \
  --allow-read \
  --allow-write \
  --allow-env \
  jsr:@beyondbetter/mcp-client-inspector
```

## Next Steps

Once installed and running:

1. **Configure your MCP client** to connect to `http://localhost:3000`
2. **Open the Web UI** at `http://localhost:8000`
3. **Start testing** - trigger sampling, elicitation, and notifications
4. **View messages** in the console in real-time

See the main [README.md](README.md) for detailed usage instructions and testing
examples.
