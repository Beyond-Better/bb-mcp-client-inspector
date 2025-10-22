# DATA_MODELS.md Integration Recommendations

## Current State Analysis

### What's Currently Implemented

**Location**: `mcp-server/src/console/types.ts`

**Current Types** (working, but minimal):
- `McpMessage` - Basic JSON-RPC structure
- `MessageEntry` - KV storage format
- `ClientInfo` - Client metadata
- `ConsoleMessage` / `ConsoleCommand` - WebSocket messages
- `NotificationPayload` / `SamplingPayload` / `ElicitationPayload` - Command payloads

**Issues**:
1. Types only in `mcp-server/`, not shared with `fresh-ui/`
2. No type guards or validation schemas
3. Less comprehensive than DATA_MODELS.md design
4. No enum definitions for constants
5. Fresh UI duplicates type definitions in components

### What DATA_MODELS.md Provides

**Comprehensive Type System**:
- Shared types in `shared/types/` directory
- Type guards for runtime validation
- Zod schemas for validation
- Enum definitions for constants
- Utility types (Result, AsyncResult, etc.)
- Branded types for IDs (SessionId, ClientId, etc.)

## Integration Strategy

### Phase 1: Create Shared Types Directory (1 hour)

**Goal**: Establish foundation for shared types

**Steps**:
```bash
mkdir -p shared/types
```

**Files to Create**:
1. `shared/types/console.types.ts` - WebSocket protocol types
2. `shared/types/mcp.types.ts` - MCP protocol types  
3. `shared/types/common.types.ts` - Utility types

**Start Simple**: Copy existing types from `mcp-server/src/console/types.ts` and enhance incrementally.

### Phase 2: Enhance Console Types (1 hour)

**File**: `shared/types/console.types.ts`

**Priority Enhancements**:

1. **String Literal Union Types** (instead of plain strings):
```typescript
export type ConsoleMessageType =
  | "connection_established"
  | "client_list"
  | "message_history"
  | "mcp_message"
  | "tool_call"
  | "tool_response"
  | "sampling_response"
  | "sampling_error"
  | "elicitation_response"
  | "elicitation_error"
  | "notification_sent"
  | "error";
```

2. **Enhanced Elicitation Types**:
```typescript
export interface ElicitationSchema {
  type: "object" | "string" | "number" | "boolean" | "array";
  properties?: Record<string, ElicitationSchemaProperty>;
  required?: string[];
  description?: string;
}

export interface ElicitationSchemaProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  enum?: unknown[];
  enumNames?: string[];
  items?: ElicitationSchemaProperty;
  properties?: Record<string, ElicitationSchemaProperty>;
}
```

3. **Type Guards**:
```typescript
export function isConsoleMessage(value: unknown): value is ConsoleMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "payload" in value
  );
}

export function isElicitationResponse(
  message: ConsoleMessage
): message is ConsoleMessage & { type: "elicitation_response" } {
  return message.type === "elicitation_response";
}
```

### Phase 3: Add Validation Schemas (30 minutes)

**File**: `shared/types/validation.ts`

**Add Zod Schemas**:
```typescript
import { z } from "zod";

export const consoleCommandSchema = z.object({
  type: z.enum([
    "trigger_notification",
    "request_sampling",
    "request_elicitation",
    "get_clients",
    "get_message_history",
  ]),
  payload: z.unknown().optional(),
});

export const elicitationPayloadSchema = z.object({
  message: z.string().min(1, "Message is required"),
  requestedSchema: z
    .object({
      type: z.enum(["object", "string", "number", "boolean", "array"]),
      properties: z.record(z.unknown()).optional(),
      required: z.array(z.string()).optional(),
      description: z.string().optional(),
    })
    .optional(),
});
```

**Usage in ConsoleManager**:
```typescript
private async handleMessage(connectionId: string, data: string): Promise<void> {
  try {
    const parsed = JSON.parse(data);
    
    // Validate with Zod
    const command = consoleCommandSchema.parse(parsed);
    
    // Type is now validated and typed correctly
    switch (command.type) {
      // ...
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      this.sendToClient(connectionId, {
        type: "error",
        payload: {
          message: "Invalid command format",
          details: error.errors,
        },
      });
    }
  }
}
```

### Phase 4: Update Import Paths (30 minutes)

**MCP Server Updates**:
```typescript
// OLD: import { ConsoleMessage } from "./console/types.ts";
// NEW:
import type { ConsoleMessage, ConsoleCommand } from "../../../shared/types/console.types.ts";
```

**Fresh UI Updates**:
```typescript
// In hooks/useWebSocket.ts
import type { ConsoleMessage, ConsoleCommand } from "../../../shared/types/console.types.ts";

// In components
import type { ElicitationPayload, ElicitationResponsePayload } from "../../../shared/types/console.types.ts";
```

**Deno Import Map** (add to both `deno.json`):
```json
{
  "imports": {
    "@shared/types/": "../shared/types/"
  }
}
```

Then imports become:
```typescript
import type { ConsoleMessage } from "@shared/types/console.types.ts";
```

### Phase 5: Add Utility Types (20 minutes)

**File**: `shared/types/common.types.ts`

**High-Value Additions**:

1. **Result Type** (for error handling):
```typescript
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Usage:
async function requestElicitation(payload: ElicitationPayload): AsyncResult<ElicitationResponse> {
  try {
    const response = await sendCommand(...);
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}
```

2. **Branded Types** (for type safety):
```typescript
export type Brand<T, B> = T & { __brand: B };

export type SessionId = Brand<string, "SessionId">;
export type ClientId = Brand<string, "ClientId">;
export type ConnectionId = Brand<string, "ConnectionId">;

// Usage prevents mixing up IDs:
function getClient(id: ClientId): ClientInfo { ... }
const sessionId: SessionId = "abc-123" as SessionId;
getClient(sessionId); // Type error! Can't pass SessionId where ClientId expected
```

3. **JSON Types** (for type-safe JSON handling):
```typescript
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// Usage:
function parseMessage(json: string): JsonValue {
  return JSON.parse(json);
}
```

## Where to Use DATA_MODELS.md Types

### High Priority (Immediate Benefit)

1. **ConsoleManager.ts**:
   - Use type guards for message validation
   - Use Zod schemas for payload validation
   - Use typed payloads instead of `unknown`

2. **useWebSocket.ts**:
   - Use shared ConsoleMessage/ConsoleCommand types
   - Remove duplicated type definitions
   - Use type guards in message handling

3. **ElicitationForm.tsx**:
   - Use ElicitationPayload type
   - Use ElicitationSchema type for JSON schema
   - Validate before sending

4. **ElicitationResponse.tsx**:
   - Use ElicitationResponsePayload type
   - Use type guards for message filtering

### Medium Priority (Code Quality)

1. **MessageTracker.ts**:
   - Use StoredMessage, StoredClient types
   - Use branded types for IDs
   - Use KV key type patterns

2. **All Form Components**:
   - Use payload types from shared/types
   - Consistent validation
   - Type-safe command building

3. **Message Viewer Components**:
   - Use type guards for message filtering
   - Type-safe payload access
   - Better type inference

### Low Priority (Nice to Have)

1. **Enum Definitions**:
   - Replace string literals with enums
   - Type-safe constant access
   - Better IDE autocomplete

2. **Advanced Utility Types**:
   - DeepPartial, Optional, Required helpers
   - Extract payload utilities
   - More complex type transformations

## Migration Path

### Option A: Gradual (Recommended)

**Week 1**: Create shared/types/ directory with basic types
- Copy existing types to shared location
- Update a few key imports as proof of concept
- Test that both servers still work

**Week 2**: Add type guards and validation
- Implement type guard functions
- Add Zod schemas for critical paths
- Update ConsoleManager to use validation

**Week 3**: Migrate all components
- Update all remaining imports
- Remove duplicate type definitions
- Add comprehensive types from DATA_MODELS.md

**Week 4**: Polish and document
- Add JSDoc comments
- Update documentation
- Write type usage examples

### Option B: Big Bang (Higher Risk)

**Day 1**: Create complete shared/types/ structure from DATA_MODELS.md
**Day 2**: Update all imports in mcp-server
**Day 3**: Update all imports in fresh-ui
**Day 4**: Testing and fixes

**Risk**: More changes at once, harder to debug if issues arise

## Practical Examples

### Example 1: Type-Safe Message Handling

**Before** (current code):
```typescript
socket.onmessage = (event) => {
  const message = JSON.parse(event.data); // any type
  if (message.type === "elicitation_response") {
    const payload = message.payload; // any type
    console.log(payload.action); // no type checking
  }
};
```

**After** (with shared types):
```typescript
import { isConsoleMessage, isElicitationResponse } from "@shared/types/console.types.ts";
import type { ElicitationResponsePayload } from "@shared/types/console.types.ts";

socket.onmessage = (event) => {
  const parsed = JSON.parse(event.data);
  
  if (!isConsoleMessage(parsed)) {
    console.error("Invalid message format");
    return;
  }
  
  if (isElicitationResponse(parsed)) {
    const payload = parsed.payload as ElicitationResponsePayload;
    // TypeScript knows: payload.action is "accept" | "decline" | "cancel"
    // TypeScript knows: payload.content is optional Record<string, unknown>
    console.log(payload.action); // fully typed!
  }
};
```

### Example 2: Validated Command Sending

**Before** (current code):
```typescript
const handleSubmit = () => {
  sendCommand({
    type: "request_elicitation",
    payload: {
      message: message.value,
      requestedSchema: schemaJson.value ? JSON.parse(schemaJson.value) : undefined,
    },
  });
};
```

**After** (with validation):
```typescript
import { elicitationPayloadSchema } from "@shared/types/validation.ts";
import type { ElicitationPayload } from "@shared/types/console.types.ts";

const handleSubmit = () => {
  const payload: ElicitationPayload = {
    message: message.value,
    requestedSchema: schemaJson.value ? JSON.parse(schemaJson.value) : undefined,
  };
  
  // Validate before sending
  const result = elicitationPayloadSchema.safeParse(payload);
  if (!result.success) {
    alert(`Validation error: ${result.error.errors[0].message}`);
    return;
  }
  
  sendCommand({
    type: "request_elicitation",
    payload: result.data, // validated and typed
  });
};
```

### Example 3: Result Type Usage

**Before** (throwing errors):
```typescript
async function requestElicitation(payload: ElicitationPayload) {
  const response = await fetch(...);
  if (!response.ok) throw new Error("Request failed");
  return await response.json();
}

// Usage:
try {
  const result = await requestElicitation(payload);
  handleSuccess(result);
} catch (error) {
  handleError(error);
}
```

**After** (Result type):
```typescript
import type { AsyncResult } from "@shared/types/common.types.ts";

async function requestElicitation(
  payload: ElicitationPayload
): AsyncResult<ElicitationResponsePayload> {
  try {
    const response = await fetch(...);
    if (!response.ok) {
      return { success: false, error: new Error("Request failed") };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

// Usage (no try/catch needed):
const result = await requestElicitation(payload);
if (result.success) {
  handleSuccess(result.data); // TypeScript knows data is ElicitationResponsePayload
} else {
  handleError(result.error); // TypeScript knows error is Error
}
```

## Quick Wins (< 30 minutes each)

### Win 1: Type Guards in Message Viewer

**File**: `fresh-ui/components/MessageViewer.tsx`

**Add**:
```typescript
import { isElicitationResponse, isElicitationError } from "@shared/types/console.types.ts";

const filteredMessages = messages.filter((msg) => {
  if (filter === "elicitation") {
    return isElicitationResponse(msg) || isElicitationError(msg);
  }
  // ... other filters
});
```

**Benefit**: Type-safe filtering, no string comparison bugs

### Win 2: Shared ConsoleMessage Type

**Current**: Types duplicated in `useWebSocket.ts` and `types.ts`

**Fix**: Move to `shared/types/console.types.ts`, import in both places

**Benefit**: Single source of truth, no sync issues

### Win 3: Elicitation Payload Validation

**File**: `fresh-ui/components/ElicitationForm.tsx`

**Add**: Schema validation before sending

**Benefit**: Catch errors earlier, better UX

## Decision Matrix

### Should You Implement Full DATA_MODELS.md Now?

**YES, if**:
- Planning to add more features soon
- Team is growing (need consistency)
- Bugs from type mismatches are occurring
- Want to improve code quality score

**NO (defer), if**:
- Just need to ship v1.0 quickly
- Team is familiar with current structure
- No type-related bugs so far
- Short on time/resources

### Recommended Approach for This Project

**For v1.0**: Keep current simple types, they work fine

**For v1.1**: Implement Phase 1-2 (shared types directory + enhancements)

**For v2.0**: Full DATA_MODELS.md implementation with all features

## Summary

DATA_MODELS.md provides an **aspirational target** for comprehensive type safety. Current implementation is **good enough for v1.0**, but implementing shared types would:

**Benefits**:
- ✅ Better type safety across both servers
- ✅ Reduced code duplication
- ✅ Easier maintenance
- ✅ Better IDE support
- ✅ Catch bugs earlier

**Costs**:
- ⏰ ~3-4 hours initial implementation
- 🐛 Risk of breaking existing code during migration
- 📚 Learning curve for team

**Recommendation**: Implement incrementally starting with Phase 1-2 after v1.0 launches.

---

**Document Version**: 1.0
**Created**: 2025-10-23
**Status**: Recommendations for Future Enhancement
