# Testing Guide - MCP Client Inspector

## Phase 2 Initial Testing - WebSocket Connection

### Prerequisites

- Deno 2.5+
- Terminal access (2 terminals needed)

### Setup

1. **Terminal 1: Start MCP Server**

```bash
cd mcp-server
deno task dev
```

Expected output:
```
🔍 Starting MCP Client Inspector Server...
✅ MCP Client Inspector Server started successfully!
📡 Transport: http
🌐 HTTP endpoint: http://localhost:3030/mcp
🔌 WebSocket console: ws://localhost:3030/ws/console
🛠️  Inspector tools loaded:
   - echo
   - convert_date
   - calculate
   - delay_response
   - random_data
   - trigger_error
```

2. **Terminal 2: Start Fresh UI**

```bash
cd fresh-ui
deno task dev
```

Expected output:
```
> vite

  VITE v7.1.3  ready in XXX ms

  ➜  Local:   http://localhost:8000/
```

### Testing WebSocket Connection

1. **Open Browser**
   - Navigate to: http://localhost:8000/

2. **Check Connection Status**
   - Top right of page should show:
     - Green dot with "Connected"
     - Connection ID (8 character hash)
   - If red dot "Disconnected", check:
     - MCP server is running on port 3030
     - No firewall blocking localhost connections
     - Browser console for errors (F12)

3. **Test Notification Trigger**
   - In the right panel, find "🔔 Trigger Notification"
   - Leave default settings (Level: info, Logger: test)
   - Click "Send Notification" button
   - Check left panel "💬 Protocol Messages" for new message
   - Should see message with type "notification_sent"

4. **View Message Details**
   - Click on any message in the left panel
   - Should expand to show full JSON payload
   - Click again to collapse

5. **Test Message Filtering**
   - Use dropdown above message list
   - Try filters: All Messages, MCP Protocol, Sampling, Elicitation, Notifications
   - Message count should update based on filter

6. **Check Statistics Panel**
   - Bottom right panel shows:
     - Total Messages count
     - Filtered count
     - Status (Online/Offline)

### Browser Console Logging

The UI includes detailed console logging. Open DevTools (F12) to see:

```
[WebSocket] Connecting to ws://localhost:3030/ws/console...
[WebSocket] Connected
[WebSocket] Message received: connection_established
[WebSocket] Sending command: trigger_notification
[WebSocket] Message received: notification_sent
```

### Troubleshooting

**WebSocket won't connect:**
1. Check MCP server is running (Terminal 1)
2. Verify port 3030 in `.env` files matches
3. Check browser console for errors
4. Try refreshing the page

**Messages not appearing:**
1. Check connection status (green dot)
2. Open browser console to see WebSocket messages
3. Verify MCP server console shows no errors

**Fresh UI won't start:**
1. Run `deno cache fresh-ui/main.ts` to download dependencies
2. Check no other process is using port 8000
3. Try `deno task build` then `deno task start`

### Expected Behavior

✅ **Working correctly:**
- Green "Connected" indicator
- Connection ID displayed
- Can send notifications
- Messages appear in left panel
- Can expand/collapse messages
- Filter dropdown works
- Statistics update in real-time

❌ **Not implemented yet (Phase 2 remaining):**
- Sampling request form
- Elicitation request form
- Client selector (multi-client support)
- Message history persistence
- Auto-scroll to new messages

### Next Steps

If WebSocket connection and notification triggering work:
1. Implement Sampling Form
2. Implement Elicitation Form
3. Add Client Selector
4. Add remaining UI polish

---

**Last Updated**: 2025-10-22
**Phase**: 2 (Initial)
**Status**: WebSocket connection and notification triggering ready for testing
