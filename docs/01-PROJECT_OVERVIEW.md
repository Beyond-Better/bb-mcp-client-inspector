# MCP Server Client Inspector - Project Overview

## Project Purpose

The MCP Server Client Inspector is a comprehensive testing platform for validating MCP (Model Context Protocol) client implementations. It provides an interactive web console for testing client behavior across sampling, elicitation, and notification handling mechanisms.

## Problem Statement

While the MCP Inspector exists as an MCP client for testing servers, there is no equivalent tool for testing MCP clients. Developers building MCP clients need a reliable way to:

- Test sampling request handling (LLM completion requests)
- Validate elicitation flows (user input requests)
- Verify notification processing (list change notifications)
- Debug MCP protocol message exchanges
- Monitor client connection lifecycle

## Solution

A dual-server architecture providing:

1. **MCP Server**: Implements MCP protocol with:
   - Basic utility tools (echo, date conversion, calculations, etc.)
   - Console integration via WebSocket
   - Message tracking and session management
   - Support for STDIO and HTTP transports

2. **Fresh UI Console**: Web-based testing interface with:
   - Real-time connection monitoring
   - Sampling request builder and tester
   - Elicitation request builder and tester
   - Notification trigger controls
   - Protocol message viewer
   - Multi-client support (for HTTP transport)

## Key Features

### Version 1.0 (Initial Release)

#### MCP Server
- ✅ Basic inspector tools (echo, convert_date, calculate, delay_response, random_data, trigger_error)
- ✅ WebSocket endpoint for console integration
- ✅ Message tracking and broadcasting
- ✅ Session management with Deno KV
- ✅ STDIO and HTTP transport support
- ✅ Multi-client support (HTTP mode)

#### Fresh UI Console
- ✅ Connection status monitoring
- ✅ Client selector (for multi-client scenarios)
- ✅ Sampling request form (message, model, temperature, max_tokens)
- ✅ Elicitation request form (message, schema as JSON)
- ✅ Notification triggers (tools/resources/prompts list_changed)
- ✅ Message viewer (all JSON-RPC messages)
- ✅ Response inspector with detailed views
- ✅ Real-time updates via WebSocket

### Roadmap (Future Versions)

- 🔄 Multi-turn sampling conversations
- 🔄 Streaming response support
- 🔄 Advanced sampling configurations
- 🔄 Multi-step elicitation flows
- 🔄 Structured elicitation form builder (vs JSON input)
- 🔄 Custom notification types
- 🔄 Notification frequency/rate testing
- 🔄 Message filtering in viewer
- 🔄 Pre-configured test scenarios
- 🔄 Session export/import
- 🔄 Client metrics and analytics
- 🔄 WebSocket token authentication

## Technology Stack

### MCP Server
- **Runtime**: Deno 2.5+
- **Framework**: bb-mcp-server library (AppServer pattern)
- **MCP SDK**: @modelcontextprotocol/sdk v1.18.2
- **Storage**: Deno KV
- **WebSocket**: Native Deno WebSocket API
- **Language**: TypeScript

### Fresh UI Server
- **Framework**: Deno Fresh (latest stable)
- **Runtime**: Deno 2.5+
- **UI Components**: Fresh Islands (Preact)
- **Styling**: Tailwind CSS (Fresh default)
- **WebSocket Client**: Native browser WebSocket API
- **Language**: TypeScript + JSX

## Architecture Highlights

### Separation of Concerns
```
┌─────────────────────────────────────┐
│  MCP Server (Deno)                  │
│  ├─ STDIO/HTTP transport (MCP)      │
│  ├─ WebSocket endpoint (/ws/console)│
│  ├─ Inspector tools                 │
│  └─ Session management (KV)         │
└──────────────┬──────────────────────┘
               │ WebSocket
               │ (real-time updates)
┌──────────────▼──────────────────────┐
│  Fresh UI Server (Deno Fresh)       │
│  ├─ Console UI routes               │
│  ├─ WebSocket client                │
│  ├─ Hot reload (dev mode)           │
│  └─ Static assets                   │
└─────────────────────────────────────┘
```

### Key Design Decisions

1. **Separate Processes**: MCP server and UI server run independently
   - Clean separation of concerns
   - Independent testing and development
   - Fresh hot reload works naturally
   - Can deploy together or separately

2. **WebSocket Communication**: Real-time UI updates
   - MCP server broadcasts protocol messages
   - UI sends commands (trigger notifications)
   - Low latency for testing feedback

3. **bb-mcp-server Library**: Proven infrastructure
   - Plugin-based architecture
   - Built-in session management
   - Transport abstraction
   - Consistent with ecosystem

4. **Multi-Client Support**: Essential for HTTP transport
   - Client selector in UI
   - Session-based tracking
   - Isolated message streams

## Target Users

### Primary
- **MCP Client Developers**: Testing client implementations
- **Integration Developers**: Validating MCP integrations
- **QA Engineers**: Systematic client testing

### Secondary
- **MCP Learning**: Understanding protocol mechanics
- **Debugging**: Troubleshooting client issues
- **Demo/Education**: Teaching MCP concepts

## Success Metrics

### Functionality
- ✅ Successfully tests sampling requests and responses
- ✅ Successfully tests elicitation flows (accept/decline/cancel)
- ✅ Successfully triggers and verifies notifications
- ✅ Displays all MCP protocol messages clearly
- ✅ Handles multiple connected clients (HTTP mode)

### Usability
- ✅ Simple setup (< 5 minutes from clone to running)
- ✅ Intuitive UI (minimal learning curve)
- ✅ Clear error messages and feedback
- ✅ Responsive real-time updates

### Quality
- ✅ Comprehensive test coverage (>80%)
- ✅ Clear documentation for LLM consumption
- ✅ Example test scenarios included
- ✅ Production-ready error handling

## Project Structure

```
bb-mcp-server-client-inspector/
├── docs/                           # Design documentation
│   ├── 01-PROJECT_OVERVIEW.md      # Project summary and goals
│   ├── 02-ARCHITECTURE.md          # System architecture
│   ├── 03-MCP_SERVER_DESIGN.md     # MCP server specifications
│   ├── 04-FRESH_UI_DESIGN.md       # Fresh UI specifications
│   ├── 05-DATA_MODELS.md           # Type definitions
│   ├── 06-WEBSOCKET_PROTOCOL.md    # Console communication protocol
│   ├── 07-TESTING_STRATEGY.md      # Testing approach
│   └── 08-IMPLEMENTATION_PHASES.md # Development roadmap
├── mcp-server/                     # MCP Server
│   ├── main.ts
│   ├── deno.json
│   ├── .env.example
│   ├── src/
│   │   ├── plugins/
│   │   │   └── inspector.plugin/
│   │   ├── console/
│   │   └── dependencyHelper.ts
│   └── tests/
├── fresh-ui/                       # Fresh UI Server
│   ├── main.ts
│   ├── deno.json
│   ├── routes/
│   ├── islands/
│   ├── components/
│   └── static/
└── shared/                         # Shared types
    └── types/
```

## Development Approach

### Phase 1: Foundation (Week 1)
- MCP server basic setup with bb-mcp-server
- Inspector tools implementation
- WebSocket endpoint for console
- Fresh UI basic setup

### Phase 2: Core Features (Week 2)
- Sampling request builder and tester
- Elicitation request builder and tester
- Notification triggers
- Message viewer

### Phase 3: Multi-Client & Polish (Week 3)
- Client selector implementation
- Connection status monitoring
- Response inspector enhancements
- Testing and documentation

### Phase 4: Release Preparation (Week 4)
- Comprehensive testing
- Documentation completion
- Example scenarios
- Deployment preparation

## Documentation Structure

This project includes comprehensive documentation for LLM consumption:

1. **PROJECT_OVERVIEW.md** (this file) - Project summary and context
2. **ARCHITECTURE.md** - System architecture and component interactions
3. **MCP_SERVER_DESIGN.md** - MCP server implementation specifications
4. **FRESH_UI_DESIGN.md** - Fresh UI server and component specifications
5. **DATA_MODELS.md** - Type definitions and data structures
6. **WEBSOCKET_PROTOCOL.md** - Console WebSocket protocol specification
7. **TESTING_STRATEGY.md** - Testing approach and examples
8. **IMPLEMENTATION_PHASES.md** - Detailed implementation phases with roadmap

Each document is designed for LLM consumption in implementation conversations.

## Quick Start (For Implementers)

### Prerequisites
```bash
# Deno 2.5+
deno --version

# bb-mcp-server available
deno info jsr:@beyondbetter/bb-mcp-server
```

### Development Setup
```bash
# Terminal 1: MCP Server
cd mcp-server
cp .env.example .env
deno task dev

# Terminal 2: Fresh UI
cd fresh-ui
deno task dev
```

### Testing
```bash
# MCP Server tests
cd mcp-server
deno task test

# UI tests (if applicable)
cd fresh-ui
deno task test
```

## Open Source Release

### License
MIT License (recommended for maximum adoption)

### Repository
GitHub: `beyond-better/bb-mcp-server-client-inspector`

### Documentation for Users
- README.md - User-facing setup and usage
- CONTRIBUTING.md - Contribution guidelines
- Examples and tutorials

### Publication
- JSR package for easy distribution
- GitHub releases with changelogs
- Documentation site (optional, later)

## Next Steps

For implementation:

1. **Review all design documents** in order:
   - Start with ARCHITECTURE.md
   - Then MCP_SERVER_DESIGN.md and FRESH_UI_DESIGN.md
   - Reference DATA_MODELS.md and WEBSOCKET_PROTOCOL.md as needed
   - Use TESTING_STRATEGY.md for test implementation
   - Follow IMPLEMENTATION_PHASES.md for structured development

2. **Set up project structure** as defined

3. **Begin Phase 1 implementation** (see IMPLEMENTATION_PHASES.md)

4. **Iterate through phases** with testing at each step

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Status**: Design Complete - Ready for Implementation