# Elicitation Implementation Guide

## Overview

This document describes the unified elicitation component implementation that supports both user approval and form-based data collection.

## Architecture Decision

**Single Component Approach**: One `ElicitationForm` component with two modes (approval/form) rather than separate components.

**Rationale**:
- Matches BB's feedback system where approval is elicitation with empty `formData: {}`
- MCP protocol treats both as elicitation with optional schema
- Avoids code duplication for approve/decline/cancel logic
- Follows project's 1-2 parent islands architecture guideline

## Components

### 1. ElicitationForm Component

**Location**: `fresh-ui/components/ElicitationForm.tsx`

**Features**:
- Radio toggle for mode switching (Approval vs Form)
- Message input (required)
- JSON schema input (Form mode only)
- Example schema loader
- Submit and Clear buttons
- Contextual help text
- Disabled state when not connected

**Modes**:

#### Approval Mode
- Simple user approval workflow
- No schema required
- Client shows Accept/Decline/Cancel dialog
- Response: `{ action: "accept", content: {} }`

**Example Use Case**:
```typescript
// Message: "Do you approve this action?"
// No schema
// Client response: { action: "accept", content: {} }
```

#### Form Mode
- Structured data collection
- JSON schema required
- Client shows form based on schema
- Response: `{ action: "accept", content: {...form data...} }`

**Example Use Case**:
```typescript
// Message: "Please provide your contact information"
// Schema: {
//   type: "object",
//   properties: {
//     name: { type: "string", description: "Full name" },
//     email: { type: "string", description: "Email address" }
//   },
//   required: ["name", "email"]
// }
// Client response: { 
//   action: "accept", 
//   content: { name: "John Doe", email: "john@example.com" } 
// }
```

### 2. ElicitationResponse Component

**Location**: `fresh-ui/components/ElicitationResponse.tsx`

**Features**:
- Displays most recent elicitation response
- Color-coded action badges:
  - ✅ Accepted (green)
  - ❌ Declined (red)
  - 🚫 Cancelled (yellow)
- Formatted JSON display for form data
- Error handling with details
- Timestamp display
- Placeholder when no responses yet

**Display Logic**:
- Searches backwards through message history for latest response
- Shows either success response or error
- Automatically updates when new responses arrive (via signals)

### 3. CommandPanel Integration

**Location**: `fresh-ui/components/CommandPanel.tsx`

**Changes**:
1. Added ElicitationForm import
2. Added ElicitationResponse import
3. Enabled "Elicitation" tab (removed `disabled: true`)
4. Render ElicitationForm in tab content
5. Added divider + ElicitationResponse panel below form

**Layout**:
```
╭──────────────────────────╮
│ 🎮 Command Panel          │
├──────────────────────────┤
│ [Notifications|Sampling|Elicitation] │
├──────────────────────────┤
│                            │
│  [ElicitationForm]         │
│                            │
├────── Latest Response ──────┤
│                            │
│  [ElicitationResponse]     │
│                            │
╰──────────────────────────╯
```

## Server-Side Implementation

**Location**: `mcp-server/src/console/ConsoleManager.ts`

**Already Implemented**: ✅
- Handles `request_elicitation` command
- Calls `beyondMcpServer.elicitInput()`
- Broadcasts `elicitation_response` on success
- Broadcasts `elicitation_error` on failure

**Request Format**:
```typescript
{
  type: "request_elicitation",
  payload: {
    message: string,
    requestedSchema?: Record<string, unknown>
  }
}
```

**Response Format**:
```typescript
// Success
{
  type: "elicitation_response",
  payload: {
    action: "accept" | "decline" | "cancel",
    content?: Record<string, unknown>
  },
  timestamp: number
}

// Error
{
  type: "elicitation_error",
  payload: {
    message: string,
    error?: string,
    code?: string
  },
  timestamp: number
}
```

## WebSocket Protocol

**Reference**: `docs/06-WEBSOCKET_PROTOCOL.md`

**Flow**:
```
Console UI          MCP Server          MCP Client
    │                   │                   │
    │─request_elicit──>│                   │
    │                   │─elicitInput────>│
    │                   │                   │
    │                   │  [User interacts]  │
    │                   │                   │
    │                   │<──response─────│
    │<─elicit_response─│                   │
    │                   │                   │
```

## Testing Scenarios

### Scenario 1: User Approval (Accept)

1. Switch to "Elicitation" tab
2. Select "Approval" mode
3. Enter message: "Do you approve this action?"
4. Click "Request Approval"
5. **Expected**: Client shows approval dialog
6. User clicks "Accept"
7. **Verify**: 
   - Message viewer shows `elicitation_response`
   - Response panel shows ✅ Accepted badge
   - Content is empty object `{}`

### Scenario 2: User Approval (Decline)

1. Follow steps 1-4 from Scenario 1
2. User clicks "Decline"
3. **Verify**:
   - Response panel shows ❌ Declined badge
   - Content is empty object `{}`

### Scenario 3: Form Data Collection

1. Switch to "Elicitation" tab
2. Select "Form" mode
3. Enter message: "Please provide your contact information"
4. Click "Load example" to populate schema
5. Click "Request Form Data"
6. **Expected**: Client shows form with name, email, age fields
7. User fills form and submits
8. **Verify**:
   - Message viewer shows `elicitation_response`
   - Response panel shows ✅ Accepted badge
   - Content shows filled form data:
     ```json
     {
       "name": "John Doe",
       "email": "john@example.com",
       "age": 30
     }
     ```

### Scenario 4: Client Error

1. Send elicitation request with invalid schema
2. **Verify**:
   - Message viewer shows `elicitation_error`
   - Response panel shows error alert
   - Error message and code displayed

### Scenario 5: Client Not Supporting Elicitation

1. Connect MCP client without elicitation capability
2. Send elicitation request
3. **Verify**:
   - Error message: "Client does not support elicitation"
   - Code: "CAPABILITY_NOT_SUPPORTED"

## State Management

**Pattern**: Preact Signals (module-level)

**ElicitationForm State**:
```typescript
const elicitationMode = signal<"approval" | "form">("approval");
const message = signal("");
const schemaJson = signal("");
```

**Shared WebSocket State** (from `useWebSocket.ts`):
```typescript
export const wsConnected = signal(false);
export const wsMessages = signal<ConsoleMessage[]>([]);
```

**ElicitationResponse State**:
```typescript
const latestResponse = computed(() => {
  // Searches wsMessages backwards for latest elicitation response
});
```

## UI/UX Details

### DaisyUI Components Used

- **Form Controls**: `form-control`, `label`, `textarea`, `input[type=radio]`
- **Buttons**: `btn`, `btn-primary`, `btn-ghost`, `join`
- **Badges**: `badge`, `badge-success`, `badge-error`, `badge-warning`
- **Alerts**: `alert`, `alert-info`, `alert-error`
- **Layout**: `divider`, `space-y-*`, `gap-*`

### Mode Toggle Design

Using DaisyUI's `join` component for radio button group:
```html
<div class="join">
  <input type="radio" class="join-item btn" aria-label="Approval" />
  <input type="radio" class="join-item btn" aria-label="Form" />
</div>
```

### Response Display Design

**Action Badges**:
- Accept: Green badge with ✅ emoji
- Decline: Red badge with ❌ emoji  
- Cancel: Yellow badge with 🚫 emoji

**Form Data Display**:
- Formatted JSON in code block
- Syntax highlighting via `font-mono` class
- Scrollable if large

## Type Safety

### Current Types (mcp-server/src/console/types.ts)

```typescript
export interface ElicitationPayload {
  message: string;
  requestedSchema?: Record<string, unknown>;
}
```

### Recommended Enhancement (from DATA_MODELS.md)

Create `shared/types/console.types.ts` with comprehensive types:

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

export interface ElicitationResponsePayload {
  action: "accept" | "decline" | "cancel";
  content?: Record<string, unknown>;
}
```

**Note**: Current implementation uses simpler types which work fine for v1.0. Enhanced types can be added when implementing the `shared/types/` structure.

## Connection to BB's Feedback System

**BB's Request Feedback Pattern**:
```typescript
const response = await feedbackManager.requestFeedback({
  messageId,
  collaborationId,
  interactionId,
  requestType,
  content: enhancedContent,
  defaultResponse: {
    action: defaultAction,
    formData: {},  // <-- Empty for approval, populated for forms
  },
  timeout: config.timeout * 1000,
  source: { type: 'tool', name: toolName },
});
```

**Our Mapping**:
- BB's "user approval" = Our "approval mode" (formData: {})
- BB's "form elicitation" = Our "form mode" (formData: {...})
- Both use same mechanism, just different payload

## Future Enhancements (Roadmap)

### v1.1+
- Visual form builder (no JSON editing)
- Form validation preview
- Schema templates library
- Multi-step elicitation flows
- Form field type helpers (date picker, file upload, etc.)

### v1.2+
- Form response history
- Export/import form schemas
- Schema validation before sending
- Form field conditions (show/hide based on values)

## Troubleshooting

### Issue: Response not showing in panel

**Symptoms**: Elicitation request sent, but response panel doesn't update

**Check**:
1. Look in message viewer - is `elicitation_response` there?
2. Check browser console for errors
3. Verify computed signal is updating
4. Check if response has correct type string

**Fix**: The computed signal searches backwards through messages. If message type doesn't match exactly, it won't be found.

### Issue: Schema validation error

**Symptoms**: "Invalid JSON schema" alert when submitting

**Check**:
1. JSON syntax is valid (no trailing commas, quotes correct)
2. Schema has `type` field
3. Properties are properly formatted

**Fix**: Click "Load example" to see correct format, then modify

### Issue: Client not responding

**Symptoms**: Request sent, but no response received

**Check**:
1. Client supports elicitation (check initialize response)
2. Client is still connected
3. Timeout not too short
4. Client logs for errors

**Fix**: Check client implementation and capabilities

## Files Modified/Created

### Created
- ✅ `fresh-ui/components/ElicitationForm.tsx` (180 lines)
- ✅ `fresh-ui/components/ElicitationResponse.tsx` (149 lines)
- ✅ `docs/ELICITATION_IMPLEMENTATION.md` (this file)

### Modified
- ✅ `fresh-ui/components/CommandPanel.tsx`
  - Added imports for ElicitationForm and ElicitationResponse
  - Enabled elicitation tab (removed disabled flag)
  - Added ElicitationForm to tab content
  - Added response display panel with divider

### No Changes Needed
- ✅ `mcp-server/src/console/ConsoleManager.ts` (already handles elicitation)
- ✅ `mcp-server/src/console/types.ts` (types sufficient for v1.0)
- ✅ `fresh-ui/hooks/useWebSocket.ts` (already supports message types)

## Testing Checklist

- [ ] Start MCP server: `cd mcp-server && deno task dev`
- [ ] Start Fresh UI: `cd fresh-ui && deno task dev`
- [ ] Connect to http://localhost:8000
- [ ] Verify WebSocket connection (green indicator)
- [ ] Switch to "Elicitation" tab
- [ ] Test Approval Mode:
  - [ ] Enter message
  - [ ] Send request
  - [ ] Verify request appears in message viewer
  - [ ] Client shows approval dialog
  - [ ] Test Accept action
  - [ ] Test Decline action
  - [ ] Test Cancel action
  - [ ] Verify response appears in both message viewer and panel
- [ ] Test Form Mode:
  - [ ] Switch to Form mode
  - [ ] Load example schema
  - [ ] Modify schema if desired
  - [ ] Send request
  - [ ] Client shows form
  - [ ] Fill and submit form
  - [ ] Verify form data in response panel
- [ ] Test Error Handling:
  - [ ] Send invalid JSON schema
  - [ ] Verify error message
  - [ ] Send request with disconnected client
  - [ ] Verify error handling

---

**Document Version**: 1.0
**Created**: 2025-10-23
**Status**: Implementation Complete
**Phase**: Phase 2 - Core Features
