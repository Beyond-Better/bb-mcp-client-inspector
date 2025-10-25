# Timestamps Added to All Console Messages

**Date**: 2025-10-23 **Status**: ✅ Complete

## Summary

Added `timestamp` field to all 15 WebSocket console messages for consistent
event tracking and UI display.

## Changes Made

### Message Format Standardization

**Before** (inconsistent):

```typescript
// Some messages had timestamps in payload
{
  type: "connection_established",
  payload: {
    connectionId: "...",
    timestamp: 123,  // ❌ In payload
    serverVersion: "1.0.0"
  }
}

// Most messages had no timestamp
{
  type: "error",
  payload: { message: "..." }  // ❌ No timestamp
}
```

**After** (consistent):

```typescript
// All messages have timestamp at top level
{
  type: "connection_established",
  payload: {
    connectionId: "...",
    serverVersion: "1.0.0"
  },
  timestamp: 123  // ✓ Top level
}

{
  type: "error",
  payload: { message: "..." },
  timestamp: 456  // ✓ Top level
}
```

## Updated Messages

### Connection Messages

1. **connection_established** - Moved timestamp from payload to top level

### Error Messages (4 total)

2. **error** - Invalid command format
3. **error** - Unknown command type
4. **error** - Command processing error
5. **error** - Failed to retrieve client list
6. **error** - Failed to retrieve message history

### Notification Messages

7. **notification_sent** - Moved timestamp from payload to top level
8. **notification_error** - Added timestamp

### Sampling Messages

9. **sampling_response** - Already had timestamp ✓
10. **sampling_error** - Already had timestamp ✓

### Elicitation Messages

11. **elicitation_response** - Already had timestamp ✓
12. **elicitation_error** - Already had timestamp ✓

### Data Messages

13. **client_list** (to specific console) - Already had timestamp ✓
14. **client_list** (broadcast to all) - Already had timestamp ✓
15. **message_history** - Already had timestamp ✓

## Benefits

### For UI

- **Display**: Show when errors and events occurred
- **Sorting**: Order messages chronologically
- **Filtering**: Filter by time range
- **Debugging**: Trace event sequences

### For Consistency

- **Standard format**: All messages follow same structure
- **Type compliance**: Matches `ConsoleMessage` interface
- **Predictable**: UI code can always expect timestamp

### For Spec Alignment

- **WEBSOCKET_PROTOCOL.md**: Spec shows `timestamp?: number` as optional
- **Implementation**: Now always provided (no longer optional in practice)
- **Consistent with MCP**: Aligns with MCP protocol message tracking

## Implementation Details

### File Modified

- `mcp-server/src/console/ConsoleManager.ts`

### Pattern Used

Simple inline approach (no helper function needed):

```typescript
this.sendToClient(connectionId, {
  type: "...",
  payload: { ... },
  timestamp: Date.now(),  // ← Added to every message
});
```

### Why No Helper Function?

- **Simplicity**: Adding `timestamp: Date.now()` is already minimal
- **Clarity**: Explicit is better than implicit
- **Type Safety**: TypeScript enforces the field
- **No Overhead**: No extra function calls

### Alternative Considered

```typescript
// Helper function approach (not used)
function createMessage(type: string, payload: unknown): ConsoleMessage {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}
```

**Decision**: Didn't implement helper because:

- Only 15 callsites (small codebase)
- Type safety already enforced by `ConsoleMessage` interface
- Inline is more explicit and readable
- Can always add helper later if codebase grows

## Testing

### Verify Timestamps Present

```bash
# Start servers
cd mcp-server && deno task dev
cd fresh-ui && deno task dev

# Open browser console
# Trigger various actions (notifications, sampling, etc.)
# Check WebSocket messages have timestamps
```

### Expected Behavior

Every WebSocket message should have:

```json
{
  "type": "...",
  "payload": { ... },
  "timestamp": 1234567890123
}
```

## Spec Update

The WEBSOCKET_PROTOCOL.md spec already shows:

```typescript
interface Message {
  type: string;
  payload: unknown;
  timestamp?: number; // Optional
}
```

**Current Implementation**: Timestamp is always provided (effectively required)

**Spec Status**:

- ✅ No update needed - spec allows optional timestamp
- 📝 Could clarify: "Server always provides timestamp"
- 🔵 Optional field is fine (allows future client messages without timestamp)

## Future Considerations

### If Codebase Grows

Consider adding helper if:

- More than 50 message callsites
- Need custom timestamp logic (e.g., mock in tests)
- Want centralized message creation logging

### Potential Helper

```typescript
import { createConsoleMessage } from '@shared/types/index.ts';

// In shared/types/console.types.ts
export function createConsoleMessage<T extends ConsoleMessageType>(
  type: T,
  payload: unknown,
): ConsoleMessage {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}
```

---

**Completed**: 2025-10-23 **Files Changed**: 1 (ConsoleManager.ts) **Messages
Updated**: 15 total **Breaking Changes**: None (timestamp was already optional)
**Status**: ✅ Ready for testing
