---
title: MCP Server Client Inspector Guidelines
project: bb-mcp-server-client-inspector
version: 1.0.0
created: 2025-10-22
purpose: Guidelines for ongoing maintenance and development of the MCP Server Client Inspector
---

# MCP Server Client Inspector - Project Guidelines

## Project Overview

The **MCP Server Client Inspector** is a comprehensive testing platform for MCP
(Model Context Protocol) client implementations. It provides an interactive web
console for testing and validating MCP clients through an MCP server that offers
inspection tools, sampling, elicitation, and notification testing capabilities.

**Key Purpose**: While the MCP Inspector tests MCP servers, this project fills
the inverse need - an MCP server for testing MCP clients.

**Technology Stack**:

- Runtime: Deno 2.5+
- MCP Framework: bb-mcp-server library
- UI Framework: Deno Fresh with Preact Islands
- UI Components: DaisyUI (Tailwind CSS-based component library)
- CSS Framework: Tailwind CSS
- Storage: Deno KV
- Language: TypeScript with strict mode

**Project Status**: New project with comprehensive design documentation; ready
for implementation and ongoing maintenance.

## Project Structure and Organization

### Directory Layout

```
bb-mcp-server-client-inspector/
├── docs/                           # Design documentation (reference)
│   ├── 01-PROJECT_OVERVIEW.md
│   ├── 02-ARCHITECTURE.md          # Keep updated with code changes
│   ├── 03-MCP_SERVER_DESIGN.md
│   ├── 04-FRESH_UI_DESIGN.md
│   ├── 05-DATA_MODELS.md
│   ├── 06-WEBSOCKET_PROTOCOL.md    # CRITICAL: Keep updated with protocol changes
│   ├── 07-TESTING_STRATEGY.md
│   └── 08-IMPLEMENTATION_PHASES.md
├── mcp-server/                     # MCP Server implementation
│   ├── main.ts
│   ├── .env.example                # Keep current with all config options
│   ├── src/
│   │   ├── plugins/                # Organize by functional category
│   │   │   └── inspector.plugin/
│   │   ├── console/                # WebSocket console logic
│   │   └── dependencyHelper.ts
│   └── tests/
├── fresh-ui/                       # Fresh UI Server implementation
│   ├── main.ts
│   ├── .env.example                # Keep current with all config options
│   ├── routes/
│   ├── islands/                    # Interactive components (1-2 top-level expected)
│   ├── components/                 # Static components loaded by islands
│   └── hooks/
└── shared/                         # Code needed by BOTH servers
    └── types/                      # Shared type definitions
```

### Code Organization Rules

**Shared Directory**:

- **Use for**: Code needed by BOTH mcp-server and fresh-ui
- **Examples**: Type definitions, interfaces, constants, utilities used by both
- **Don't use for**: Server-specific logic, UI-specific logic, single-use
  utilities

**Plugin Architecture**:

- Multiple plugins are allowed and encouraged
- Organize plugins by functional category (no strict rules)
- Example categories: inspector tools, testing utilities, monitoring
- New inspector tools can be added to existing inspector.plugin or new plugins

**Fresh Islands vs Components**:

- **Islands**: Required for any browser interactivity (event handlers, state
  management)
- **Components**: Static rendering, no browser JavaScript needed
- **Common Pattern**: 1-2 top-level parent islands with components loaded by the
  island
- **Performance**: Keep islands minimal; use components wherever possible

## Development Workflow

### Implementation Approach

1. **Implement First, Then Test**
   - Write functionality first
   - Add tests after implementation is working
   - Target: >80% code coverage (aspirational, not mandatory)

2. **Reference Documentation**
   - Design docs in `docs/` are reference material, not fixed requirements
   - Consider them an "ideal state" that can evolve
   - Structure and naming can change to suit project requirements
   - Use docs for context during initial implementation

3. **Phase Completion**
   - Write status/completion documentation as each phase completes
   - Update reference docs that need to stay current (see below)
   - Update README checkmarks and version numbers

### Documentation Maintenance

**Critical Documents** (must keep updated):

1. **ARCHITECTURE.md** - Update when system architecture changes
2. **WEBSOCKET_PROTOCOL.md** - Update when WebSocket protocol changes
3. **README.md** - Keep current with:
   - Feature status checkmarks (✅/🔄)
   - Version numbers
   - Project status
   - Quick start instructions
4. **.env.example** - Update when new config options are added

**Reference Documents** (update as needed):

- Other docs in `docs/` are primarily for initial implementation
- Update if they contain information that's helpful for ongoing work
- Don't worry about keeping them perfectly in sync

**When to Ask for Clarification**:

- Documentation is unclear or contradictory
- Examples don't match current code structure
- Requirements seem ambiguous or incomplete
- Breaking changes are needed but impact is unclear

### Environment Configuration

**Rule of Thumb**: Everything should be configurable via `.env`

- All configuration should default to `.env` files
- CLI arguments may be supported but are secondary
- Maintain `.env.example` in both mcp-server/ and fresh-ui/
- Document all options in `.env.example` with comments
- Include sensible defaults in code for optional settings

**Example `.env.example` structure**:

```bash
# Server Configuration
PORT=8000
HOST=localhost

# WebSocket Configuration  
WS_ENDPOINT=/ws/console

# Development
DEV_MODE=true
LOG_LEVEL=info
```

## Code Style and Standards

### TypeScript Style

**Formatting**:

- Use Deno/TypeScript default formatting
- 2 space indentation
- Strict TypeScript mode enabled
- Run `deno fmt` before committing

**Comments**:

- Average comment density (not sparse, not excessive)
- Explain "why" not "what" in comments
- Comment complex algorithms or non-obvious logic

**JSDoc**:

- Thorough JSDoc for all public APIs
- Include @param, @returns, @throws as appropriate
- Keep descriptions concise but complete
- Not necessary to document every private function

**Example**:

```typescript
/**
 * Triggers a notification to all connected clients.
 *
 * @param notificationType - Type of notification (tools/resources/prompts)
 * @param sessionId - Optional session ID to target specific client
 * @returns Promise resolving to number of clients notified
 * @throws Error if notification type is invalid
 */
export async function triggerNotification(
  notificationType: NotificationType,
  sessionId?: string,
): Promise<number> {
  // Implementation
}
```

### Error Handling

**Requirements**:

- Comprehensive error handling throughout
- Follow established patterns from bb-mcp-server and MCP SDK
- No specific error format required, but be consistent
- Graceful degradation where possible
- Log errors with appropriate context

**Pattern Example**:

```typescript
import { errorMessage, isError } from '@beyondbetter/bb-mcp-server';

try {
  await performOperation();
} catch (error) {
  logger.error('Operation failed', {
    operation: 'performOperation',
    error: errorMessage(error),
    context: {/* relevant context */},
  });

  if (isError(error)) {
    throw new Error(`Failed to perform operation: ${error.message}`);
  } else {
    throw new Error(`Failed to perform operation: ${errorMessage(error)}`);
  }
}
```

### Dependencies

**Guidelines**:

- No restrictions on adding dependencies
- Prefer Deno-native solutions when available
- Use JSR packages where possible
- Document why external dependencies are needed
- Keep dependencies up to date

**Core Dependencies** (already established):

- @modelcontextprotocol/sdk
- @beyondbetter/bb-mcp-server
- Deno Fresh framework
- Deno KV (built-in)
- DaisyUI (UI component library)
- Tailwind CSS (utility-first CSS framework)

## UI Components and DaisyUI

### DaisyUI Component Framework

**Overview**:

- DaisyUI is the primary component library for fresh-ui
- Built on top of Tailwind CSS utility classes
- Provides semantic, accessible components with consistent theming
- No JavaScript required for most components (perfect for Fresh components)
- Interactive components work seamlessly with Fresh islands

**DaisyUI MCP Server**: This project has access to a DaisyUI MCP server with the
following tools:

- `fetch_daisyui_documentation_daisyui` - Fetch entire documentation files
- `search_daisyui_documentation_daisyui` - Semantic search within DaisyUI docs
- `search_daisyui_code_daisyui` - Search DaisyUI repository code
- `fetch_generic_url_content_daisyui` - Fetch referenced URLs from documentation

**When to Use DaisyUI Tools**:

- Before creating new UI components, search DaisyUI docs for appropriate
  components
- When unsure about component APIs or available variants
- To find code examples and usage patterns
- To discover theming and customization options

### Component Implementation Guidelines

**Fresh Components (Static)**:

```typescript
// components/MessageCard.tsx
import { JSX } from 'preact';

interface MessageCardProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export function MessageCard({ message, type }: MessageCardProps): JSX.Element {
  return (
    <div class={`alert alert-${type}`}>
      <span>{message}</span>
    </div>
  );
}
```

**Fresh Islands (Interactive)**:

```typescript
// islands/ConsoleControls.tsx
import { useState } from 'preact/hooks';
import { JSX } from 'preact';

export default function ConsoleControls(): JSX.Element {
  const [isActive, setIsActive] = useState(false);

  return (
    <div class='card bg-base-100 shadow-xl'>
      <div class='card-body'>
        <h2 class='card-title'>Console Controls</h2>
        <div class='card-actions justify-end'>
          <button
            class={`btn ${isActive ? 'btn-success' : 'btn-primary'}`}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### DaisyUI Component Categories

**Layout Components**:

- `container`, `navbar`, `footer`, `hero`, `drawer`, `divider`
- Use for page structure and navigation

**Data Display**:

- `card`, `badge`, `alert`, `stat`, `table`, `timeline`, `kbd`
- Use for displaying messages, statistics, and data

**Actions**:

- `button`, `dropdown`, `modal`, `swap`, `tooltip`
- Use for user interactions and confirmations

**Form Controls**:

- `input`, `textarea`, `select`, `checkbox`, `radio`, `toggle`, `range`
- Use for sampling and elicitation test controls

**Feedback**:

- `loading`, `progress`, `radial-progress`, `toast`, `alert`
- Use for showing operation status and user feedback

### Styling Guidelines

**DaisyUI Class Patterns**:

```html
<!-- Component base class + variant -->
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-success btn-outline">Success Outline</button>

<!-- Size modifiers -->
<button class="btn btn-xs">Tiny</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-lg">Large</button>

<!-- State classes -->
<button class="btn btn-disabled">Disabled</button>
<button class="btn loading">Loading</button>
```

**Combining with Tailwind**:

```html
<!-- DaisyUI components + Tailwind utilities -->
<div class="card bg-base-100 shadow-xl max-w-md mx-auto mt-4">
  <div class="card-body space-y-4">
    <!-- Content -->
  </div>
</div>
```

**Theming**:

- DaisyUI includes multiple built-in themes
- Configure theme in `fresh.config.ts` or HTML data attributes
- Use semantic color names: `primary`, `secondary`, `accent`, `neutral`,
  `base-100`, etc.
- Theme switching can be added as a future feature

### Component Development Workflow

1. **Research Component** (use DaisyUI MCP tools):
   ```typescript
   // Example: Search for alert component documentation
   await search_daisyui_documentation_daisyui({
     query: 'alert component API',
   });
   ```

2. **Create Static Component First**:
   - Build non-interactive version in `components/`
   - Use DaisyUI classes for styling
   - Test rendering with sample data

3. **Add Interactivity if Needed**:
   - Move to `islands/` if user interaction required
   - Keep island minimal, load child components statically
   - Use Preact hooks for state management

4. **Test Responsiveness**:
   - DaisyUI components are responsive by default
   - Test on mobile, tablet, desktop viewports
   - Use Tailwind responsive prefixes if needed: `sm:`, `md:`, `lg:`, `xl:`

5. **Document Usage**:
   - Add JSDoc comments to component props
   - Include usage examples in component file or tests
   - Note any DaisyUI components used

### Common Patterns for This Project

**Message Display**:

```typescript
// Use alert component for system messages
<div class='alert alert-info'>
  <svg>...</svg>
  <span>WebSocket connected</span>
</div>;
```

**Message List**:

```typescript
// Use card or timeline for message history
<div class='timeline timeline-vertical'>
  <div class='timeline-item'>
    <div class='timeline-middle'>
      <svg>...</svg>
    </div>
    <div class='timeline-end card'>
      <div class='card-body'>
        <h3 class='card-title'>Sampling Request</h3>
        <p>Request content...</p>
      </div>
    </div>
  </div>
</div>;
```

**Control Panel**:

```typescript
// Use card with form controls
<div class='card bg-base-200'>
  <div class='card-body'>
    <h2 class='card-title'>Test Controls</h2>
    <div class='form-control'>
      <label class='label'>
        <span class='label-text'>Notification Type</span>
      </label>
      <select class='select select-bordered'>
        <option>Tools Changed</option>
        <option>Resources Changed</option>
        <option>Prompts Changed</option>
      </select>
    </div>
    <div class='card-actions justify-end'>
      <button class='btn btn-primary'>Trigger Notification</button>
    </div>
  </div>
</div>;
```

**Loading States**:

```typescript
// Use loading spinner or progress
<button class="btn btn-primary loading">Sending...</button>
<progress class="progress progress-primary w-full"></progress>
```

### Accessibility

- DaisyUI components include ARIA attributes by default
- Ensure proper semantic HTML structure
- Add descriptive labels for form controls
- Include focus indicators (DaisyUI handles this)
- Test keyboard navigation in islands
- Use semantic color combinations (DaisyUI themes are WCAG compliant)

### Performance Considerations

**Tailwind CSS Setup**:

- Configure Tailwind to purge unused styles in production
- DaisyUI adds minimal overhead (~30KB gzipped)
- Use Fresh's built-in CSS optimization

**Component Loading**:

- Keep islands small and focused
- Load heavy components lazily if needed
- Use Fresh's island hydration selectively
- Static components have zero JavaScript overhead

## Protocol and Integration

### MCP Protocol Patterns

**Follow patterns from**:

1. TypeScript MCP SDK (@modelcontextprotocol/sdk)
2. bb-mcp-server library implementations

**Guidelines**:

- Use SDK types and interfaces where available
- Follow JSON-RPC 2.0 specification strictly
- Validate all protocol messages
- Handle protocol errors according to spec

### WebSocket Protocol

**Critical Importance**: The WebSocket protocol is central to the project's
functionality.

**Requirements**:

- Use strict JSON-RPC format for all messages
- Both mcp-server and fresh-ui must be updated together
- Breaking changes are acceptable but must be handled on both sides
  simultaneously
- Always update WEBSOCKET_PROTOCOL.md when protocol changes

**Message Flow**:

```
mcp-server ←→ WebSocket (/ws/console) ←→ fresh-ui
```

**Protocol Change Process**:

1. Update WEBSOCKET_PROTOCOL.md with proposed changes
2. Implement changes in mcp-server WebSocket handler
3. Implement changes in fresh-ui WebSocket client
4. Test both sides together
5. Update any examples in documentation

### Inspector Tools

**Tool Management**:

- Tools can be changed as needed
- Tool changes don't require special documentation
- Add new tools to existing or new plugins based on functional category
- Maintain tool list in README

**Six Core Inspector Tools**:

1. echo - Message echoing with delay/transformation
2. convert_date - Date/timezone conversion
3. calculate - Basic arithmetic
4. delay_response - Configurable delays (timeout testing)
5. random_data - Random test data generation
6. trigger_error - Intentional error triggering

**Adding New Tools**:

- Follow bb-mcp-server plugin patterns
- Include tool in appropriate plugin
- Update README tool list
- Add examples if tool is complex

## Storage and Performance

### Deno KV Usage

**Two KV Instances**:

1. **bb-mcp-server Internal KV**: Managed by the library, handles session data
   automatically
2. **Custom Application KV**: For inspector-specific data (messages, test state)

**Version 1.0 Strategy**:

- Clear custom Deno KV on every launch
- No persistence of test data between runs
- No message limit enforcement
- No cleanup of old messages

**Implementation**:

```typescript
// On server startup
const kv = await Deno.openKv();
for await (const entry of kv.list({ prefix: ['inspector'] })) {
  await kv.delete(entry.key);
}
```

**Future Considerations** (Roadmap):

- Message retention policies
- Configurable storage limits
- Session data persistence
- Cleanup strategies for long-running instances

### Resource Limits

**Version 1.0**: Ignore resource limits (memory, connections, message counts)

**Roadmap Items**:

- Configurable connection limits
- Message storage limits per session
- Memory usage monitoring
- Performance metrics and analytics

## Testing Strategy

### Test Implementation

**Approach**: Implement first, then test

**Coverage Goal**: >80% (aspirational, not mandatory)

**Test Organization**:

```
mcp-server/tests/
├── plugins/
│   └── inspector.plugin.test.ts
├── console/
│   └── websocket.test.ts
└── integration/
    └── full-flow.test.ts

fresh-ui/tests/
├── islands/
│   └── console.island.test.ts
├── components/
│   └── message-viewer.test.ts
└── integration/
    └── ui-flow.test.ts
```

**Running Tests**:

```bash
# MCP Server tests
cd mcp-server
deno task test

# Fresh UI tests
cd fresh-ui
deno task test
```

### What to Test

**MCP Server**:

- Inspector tool functionality
- WebSocket message handling
- Sampling request/response flow
- Elicitation request/response flow
- Notification triggering
- Error handling and edge cases

**Fresh UI**:

- WebSocket connection management
- Message display and formatting
- User interactions
- State management
- Error display

**Integration**:

- Full sampling flow (UI → server → client → server → UI)
- Full elicitation flow
- Notification triggering and display
- Multi-client scenarios (HTTP mode)

## Development Setup

### Prerequisites

```bash
# Deno 2.5+
deno --version

# Verify bb-mcp-server library
deno info jsr:@beyondbetter/bb-mcp-server
```

### Local Development

**Terminal 1 - MCP Server**:

```bash
cd mcp-server
cp .env.example .env
# Edit .env as needed
deno task dev
```

**Terminal 2 - Fresh UI**:

```bash
cd fresh-ui
cp .env.example .env
# Edit .env as needed
deno task dev
```

### Hot Reload

- Fresh UI supports hot reload in development mode
- MCP server may require restart for some changes
- No known special hot reload considerations
- If something doesn't update, try a full restart

## Common Scenarios and Patterns

### Adding a New Inspector Tool

1. Decide which plugin to add it to (or create new plugin)
2. Implement tool following bb-mcp-server patterns
3. Add tool to server's tool list
4. Test tool functionality
5. Update README tool list

### Modifying WebSocket Protocol

1. Update WEBSOCKET_PROTOCOL.md with changes
2. Implement server-side changes in console/
3. Implement client-side changes in fresh-ui/
4. Test both sides together
5. Verify all message types still work

### Adding a New Test Capability

1. Determine what client capability to test (sampling, elicitation, etc.)
2. Design UI controls for triggering the test
3. Implement server-side test logic
4. Implement UI components/islands
5. Connect via WebSocket protocol
6. Test end-to-end flow
7. Update README if it's a major feature

### Troubleshooting

**WebSocket Not Connecting**:

- Check mcp-server is running and WebSocket endpoint is correct
- Verify CORS settings if applicable
- Check browser console for connection errors
- Verify .env configuration matches between servers

**Messages Not Appearing**:

- Verify WebSocket protocol message format
- Check server logs for errors
- Verify KV storage is working
- Check if KV was cleared on startup

**Fresh Islands Not Interactive**:

- Verify component is actually an island (in islands/ directory)
- Check browser console for JavaScript errors
- Verify island is properly imported in route
- Check if island needs client-only rendering

## Version 1.0 Scope

### In Scope

- ✅ MCP server with bb-mcp-server
- ✅ Six inspector tools
- ✅ Message storage (Deno KV)
- ✅ Fresh UI foundation
- ✅ WebSocket communication
- ✅ Sampling request/response
- ✅ Elicitation request/response
- ✅ Notification triggering
- ✅ Message viewer
- ✅ Multi-client support (HTTP mode)
- ✅ Error handling

### Out of Scope (Roadmap)

- 🔄 Multi-turn sampling conversations
- 🔄 Streaming response support
- 🔄 Message filtering in UI
- 🔄 Pre-configured test scenarios
- 🔄 Session export/import
- 🔄 Client metrics and analytics
- 🔄 WebSocket authentication
- 🔄 Resource limits and cleanup strategies
- 🔄 Message retention policies

## Project Maintenance

### Regular Updates

**After Each Feature**:

- [ ] Update README checkmarks
- [ ] Update relevant documentation (ARCHITECTURE.md, WEBSOCKET_PROTOCOL.md)
- [ ] Ensure .env.example is current
- [ ] Run tests
- [ ] Format code (`deno fmt`)

**After Each Phase**:

- [ ] Write phase completion notes
- [ ] Review and update README status
- [ ] Update version numbers if applicable
- [ ] Review test coverage
- [ ] Update any breaking changes in documentation

### Version Management

**README Version**:

- Keep in sync with actual project state
- Update "Project Status" section
- Update "Current" section with latest status

**Package Versions**:

- Update when publishing to JSR
- Follow semantic versioning
- Document breaking changes

## Communication and Status

### When Implementing Features

**BB Should**:

- Explain design decisions and rationale
- Reference design docs when relevant ("Following ARCHITECTURE.md section X...")
- Report progress phase by phase
- Show code changes before committing
- Ask for clarification when documentation is unclear
- Propose alternatives when design seems suboptimal

**Status Reporting Example**:

```
Phase 1 Progress:
✅ MCP server foundation (mcp-server/main.ts)
✅ Basic inspector tools (src/plugins/inspector.plugin/)
🔄 Message storage setup (implementing KV layer)
⏳ Fresh UI foundation (next)

Changes made:
- Created server with bb-mcp-server
- Implemented 6 core tools
- Added KV storage initialization

Next steps:
- Complete KV message storage
- Initialize Fresh UI project
```

### Completion Documentation

After completing each phase, create/update:

- `docs/STATUS.md` or similar completion notes
- README updates with current state
- Any architecture changes in ARCHITECTURE.md
- Any protocol changes in WEBSOCKET_PROTOCOL.md

## Design Principles

### Separation of Concerns

- MCP Server: Protocol handling, tool execution, message tracking
- Fresh UI: User interface, visualization, user interactions
- WebSocket: Real-time communication bridge
- Each component has single responsibility

### Simplicity First

- V1.0 includes only essential testing capabilities
- Advanced features go to roadmap
- Clear boundaries between components
- Avoid premature optimization

### Production Quality

- Comprehensive testing (>80% aspirational goal)
- Graceful error handling and recovery
- Complete documentation
- Type safety throughout (strict TypeScript)

## Security Considerations

### Version 1.0

- No WebSocket authentication (local development focus)
- No access controls
- Trust all connected clients
- Suitable for local testing only

### Future Versions (Roadmap)

- WebSocket authentication
- Client authorization
- Rate limiting
- Input validation and sanitization

## Success Criteria

### Functionality

- Successfully tests sampling requests and responses
- Successfully tests elicitation flows (accept/decline/cancel)
- Successfully triggers and verifies notifications
- Displays all MCP protocol messages clearly
- Handles multiple connected clients (HTTP mode)

### Usability

- Simple setup (< 5 minutes from clone to running)
- Intuitive UI (minimal learning curve)
- Clear error messages and feedback
- Responsive real-time updates

### Quality

- Comprehensive test coverage (>80% goal)
- Clear documentation
- Example test scenarios included
- Production-ready error handling

---

## Quick Reference

### File Paths

- MCP Server: `bb-mcp-server-client-inspector/mcp-server/`
- Fresh UI: `bb-mcp-server-client-inspector/fresh-ui/`
- Shared Code: `bb-mcp-server-client-inspector/shared/`
- Design Docs: `bb-mcp-server-client-inspector/docs/`

### Key Commands

```bash
# Format code
deno fmt

# Run tests
deno task test

# Start dev servers
cd mcp-server && deno task dev
cd fresh-ui && deno task dev
```

### Critical Files to Keep Updated

- README.md
- docs/ARCHITECTURE.md
- docs/WEBSOCKET_PROTOCOL.md
- .env.example (both directories)

### When in Doubt

- Ask for clarification
- Reference design docs for context
- Follow established patterns from bb-mcp-server and MCP SDK
- Favor simplicity over complexity
- Write tests after implementation works

---

**Guidelines Version**: 1.0.0\
**Last Updated**: 2025-10-22\
**Project Version**: 1.0.0 (Design Complete)\
**Status**: Ready for Implementation and Ongoing Maintenance
