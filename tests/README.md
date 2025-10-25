# MCP Server Client Inspector - Test Suite

Comprehensive test suite for the MCP Server Client Inspector project.

## Structure

```
tests/
├── fixtures/              # Shared test data
│   ├── mcp-messages.ts   # MCP protocol message samples
│   └── console-messages.ts # Console WebSocket message samples
├── utils/                 # Test utilities
│   ├── test-helpers.ts   # Helper functions
│   └── mocks.ts          # Mock classes
├── unit/                  # Unit tests
│   ├── mcp-server/
│   │   ├── tools/        # Tool tests
│   │   └── console/      # Console component tests
│   └── fresh-ui/
│       └── hooks/        # Hook tests
└── integration/           # Integration tests
    ├── websocket-communication.test.ts
    └── message-flow.test.ts
```

## Running Tests

### Run All Tests

```bash
# From project root
deno task tool:test

# Or run directly
deno test --allow-all --unstable-kv tests/
```

### Run Specific Test Suites

```bash
# MCP Server tests only
deno test --allow-all --unstable-kv tests/unit/mcp-server/

# Fresh UI tests only
deno test --allow-all --unstable-kv tests/unit/fresh-ui/

# Integration tests only
deno test --allow-all --unstable-kv tests/integration/

# Specific test file
deno test --allow-all --unstable-kv tests/unit/mcp-server/tools/echo.test.ts
```

### Run with Coverage

```bash
# Generate coverage
deno test --allow-all --unstable-kv --coverage=coverage tests/

# View coverage report
deno coverage coverage/

# Generate HTML report
deno coverage coverage/ --html
```

### Watch Mode

```bash
deno test --allow-all --unstable-kv --watch tests/
```

## Test Organization

### Unit Tests

**MCP Server Tools** (`tests/unit/mcp-server/tools/`):
- `echo.test.ts` - Echo tool functionality
- `calculate.test.ts` - Calculation operations
- `convertDate.test.ts` - Date conversion and formatting
- `delayResponse.test.ts` - Delay and timeout handling
- `randomData.test.ts` - Random data generation
- `triggerError.test.ts` - Error triggering and handling

**Console Components** (`tests/unit/mcp-server/console/`):
- `MessageTracker.test.ts` - Message storage and retrieval
- `ConsoleManager.test.ts` - WebSocket management and command handling

**Fresh UI Hooks** (`tests/unit/fresh-ui/hooks/`):
- `useWebSocket.test.ts` - WebSocket connection management
- `useConsoleState.test.ts` - UI state management

### Integration Tests

**WebSocket Communication** (`tests/integration/websocket-communication.test.ts`):
- Connection flow
- Message broadcasting
- Command handling
- Multi-client scenarios

**Message Flow** (`tests/integration/message-flow.test.ts`):
- Tool call flows
- Notification handling
- Sampling requests
- Elicitation flows
- Session isolation

## Test Utilities

### Test Helpers (`tests/utils/test-helpers.ts`)

**In-Memory KV**:
```typescript
const kv = await createTestKV();
// Use in tests, close in afterEach
```

**Test Logger**:
```typescript
const logger = createTestLogger({ silent: true, level: "error" });
```

**Wait Utilities**:
```typescript
await waitFor(() => condition, { timeout: 5000, interval: 100 });
```

**Sample Data**:
```typescript
const client = createSampleClientInfo({ clientId: "custom-id" });
const message = createSampleMessageEntry({ direction: "incoming" });
```

### Mock Classes (`tests/utils/mocks.ts`)

**MockBeyondMcpServer**:
```typescript
const mockServer = new MockBeyondMcpServer();
await mockServer.sendNotification({ level: "info", data: "test" });
const notifications = mockServer.getNotifications();
```

**MockMessageTracker**:
```typescript
const mockTracker = new MockMessageTracker();
await mockTracker.trackMessage(sessionId, "incoming", message);
```

**MockWebSocketServer**:
```typescript
const wsServer = new MockWebSocketServer();
const socket = wsServer.createConnection("conn-1");
wsServer.broadcast(JSON.stringify(message));
```

## Test Fixtures

### MCP Messages (`tests/fixtures/mcp-messages.ts`)

Pre-defined MCP protocol messages:
- `toolCallRequest` / `toolCallResponse`
- `toolsListRequest` / `toolsListResponse`
- `samplingRequest` / `samplingResponse`
- `elicitationRequest` / `elicitationResponseAccept`
- `notificationMessage`
- `errorResponse`

### Console Messages (`tests/fixtures/console-messages.ts`)

Pre-defined console WebSocket messages:
- `connectionEstablished`
- `clientListMessage`
- `samplingResponseMessage` / `samplingErrorMessage`
- `elicitationResponseMessage` / `elicitationErrorMessage`
- `notificationSent`

## Writing New Tests

### Unit Test Template

```typescript
import { assertEquals, assertExists } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";

describe("Component Name", () => {
  // Setup
  beforeEach(() => {
    // Initialize test dependencies
  });

  afterEach(() => {
    // Cleanup
  });

  describe("feature group", () => {
    it("should do something specific", () => {
      // Arrange
      const input = "test";

      // Act
      const result = doSomething(input);

      // Assert
      assertEquals(result, "expected");
    });
  });
});
```

### Integration Test Template

```typescript
import { assertEquals } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { createTestKV, createTestLogger } from "../utils/test-helpers.ts";

describe("Integration Scenario", () => {
  let kv: Deno.Kv;

  beforeEach(async () => {
    kv = await createTestKV();
    // Setup other dependencies
  });

  afterEach(async () => {
    await kv.close();
    // Cleanup
  });

  it("should handle complete flow", async () => {
    // Test end-to-end scenario
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Use Fixtures**: Leverage shared test data
3. **Mock External Dependencies**: Use in-memory KV, mock servers
4. **Clean Up**: Always close resources in `afterEach`
5. **Descriptive Names**: Test names should describe what they test
6. **Arrange-Act-Assert**: Follow AAA pattern
7. **Test Edge Cases**: Include error conditions and boundaries

## Continuous Integration

Tests are designed to run in CI environments:

- No external dependencies required
- In-memory storage (Deno KV)
- Mock WebSocket connections
- Deterministic behavior

## Coverage Goals

- **Overall**: >80% code coverage (aspirational)
- **Critical Paths**: >95% coverage
  - Tool execution
  - WebSocket messaging
  - Sampling/elicitation flows
  - Notification handling

## Troubleshooting

### Tests Hanging

- Check for unclosed resources (KV, WebSocket connections)
- Ensure all async operations complete
- Add timeout to hanging tests

### Flaky Tests

- Check for race conditions
- Use `waitFor` instead of fixed delays
- Ensure proper cleanup between tests

### Import Errors

- Check import paths (use relative paths)
- Ensure all dependencies are in `import_map.json`
- Run with `--unstable-kv` flag

## Contributing

When adding new features:

1. Write tests first (TDD) or alongside implementation
2. Ensure tests pass locally
3. Add test fixtures for new message types
4. Update this README if adding new test utilities
5. Aim for >80% coverage of new code

## Resources

- [Deno Testing](https://deno.land/manual/testing)
- [Deno Assertions](https://deno.land/std/testing/asserts.ts)
- [BDD Style Testing](https://deno.land/std/testing/bdd.ts)
- [Deno KV](https://deno.land/manual/runtime/kv)
