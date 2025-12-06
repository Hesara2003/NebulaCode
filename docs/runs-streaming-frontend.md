# Runs Streaming - Frontend Implementation Guide

## Overview

The frontend implementation provides a React component that displays real-time run logs in a terminal interface using xterm.js, with support for canceling runs and displaying status updates.

## Component: TerminalComponent

### Location
`frontend/components/TerminalComponent.tsx`

### Props

```typescript
type TerminalComponentProps = {
  runId: string;      // Required: The ID of the run to stream
  token?: string;     // Optional: Authentication token for WebSocket
};
```

### Usage

```tsx
import TerminalComponent from '@/components/TerminalComponent';

function MyPage() {
  const runId = 'run-123';
  const token = process.env.NEXT_PUBLIC_WS_TOKEN;

  return (
    <div className="h-full">
      <TerminalComponent runId={runId} token={token} />
    </div>
  );
}
```

### Features

1. **Real-time Log Streaming**
   - Connects to WebSocket stream for specified `runId`
   - Displays stdout in white text
   - Displays stderr in red text (ANSI escape codes)
   - Auto-scrolls as new content arrives

2. **Status Display**
   - Color-coded status badge
   - Status values: `queued`, `running`, `succeeded`, `failed`, `cancelled`
   - Updates in real-time via WebSocket events

3. **Cancel Functionality**
   - Cancel button in toolbar
   - Disabled when run is terminal state (succeeded/failed/cancelled)
   - Loading state during cancellation
   - Calls HTTP API to cancel run

4. **Responsive Design**
   - Auto-fits terminal to container size
   - Handles window resize events
   - Dark theme matching VS Code style

## Implementation Details

### State Management

```typescript
const [mounted, setMounted] = useState(false);
const [status, setStatus] = useState<RunStatus>("queued");
const [isCancelling, setIsCancelling] = useState(false);
const terminalInstanceRef = useRef<Terminal | null>(null);
const socketRef = useRef<Socket | null>(null);
```

### WebSocket Connection

The component connects to the backend using Socket.IO:

```typescript
const socket = io(apiBaseUrl, {
  transports: ["websocket"],
  auth: { token },
  path: "/runs",
  query: { runId, ...(token ? { token } : {}) },
});
```

**Connection Details:**
- Uses WebSocket transport only (no polling fallback)
- Sends token in `auth` payload and query string
- Connects to `/runs` path (separate from default Socket.IO path)
- Includes `runId` in query parameters

### Event Handlers

#### `run-event` Handler

Receives and processes stream events:

```typescript
socket.on("run-event", (msg: RunStreamEvent) => {
  if (msg.type === "stdout") {
    term.write(msg.data);
  } else if (msg.type === "stderr") {
    term.write(`\x1b[31m${msg.data}\x1b[0m`); // Red text
  } else if (msg.type === "status") {
    setStatus(msg.data);
    const reasonText = msg.reason ? ` (${msg.reason})` : "";
    term.writeln(`\r\n\x1b[36m[status]\x1b[0m ${msg.data}${reasonText}\r\n`);
  }
});
```

**Event Types:**
- `stdout`: Standard output, written directly to terminal
- `stderr`: Error output, written in red using ANSI codes
- `status`: Status updates, displayed with cyan `[status]` prefix

#### Connection Events

```typescript
socket.on("connect", () => {
  term.writeln("\x1b[32m[Connected to run stream]\x1b[0m");
});

socket.on("disconnect", () => {
  term.writeln("\x1b[31m[Disconnected from server]\x1b[0m");
});

socket.on("connect_error", (error) => {
  term.writeln("\x1b[33m[Connection error - check token or server]\x1b[0m");
});
```

### Terminal Initialization

Uses xterm.js with FitAddon for responsive sizing:

```typescript
const term = new Terminal({
  theme: {
    background: "#1e1e1e",
    foreground: "#ffffff",
    cursor: "#ffffff",
  },
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  fontSize: 14,
  cursorBlink: true,
  rows: 20,
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(terminalRef.current);
fitAddon.fit();
```

### Cancel Handler

```typescript
const handleCancel = async () => {
  setIsCancelling(true);
  try {
    await cancelRun(runId);
    setStatus("cancelled");
  } catch (error) {
    console.error("Failed to cancel run", error);
  } finally {
    setIsCancelling(false);
  }
};
```

**Button States:**
- Enabled: When status is `queued` or `running`
- Disabled: When status is `succeeded`, `failed`, or `cancelled`
- Loading: When `isCancelling` is true

### Cleanup

Properly disposes resources on unmount:

```typescript
return () => {
  window.removeEventListener("resize", handleResize);
  if (terminalInstanceRef.current) {
    terminalInstanceRef.current.dispose();
    terminalInstanceRef.current = null;
  }
  if (socketRef.current) {
    socketRef.current.disconnect();
    socketRef.current = null;
  }
};
```

## API Client

### Location
`frontend/lib/api/runs.ts`

### Functions

#### `cancelRun(runId: string)`

Cancels a run via HTTP POST request.

```typescript
export const cancelRun = async (runId: string) => {
  const { data } = await apiClient.post<{ runId: string; status: string }>(
    `/runs/${runId}/cancel`
  );
  return data;
};
```

**Usage:**
```typescript
import { cancelRun } from '@/lib/api/runs';

try {
  const result = await cancelRun('run-123');
  console.log(result); // { runId: 'run-123', status: 'cancelled' }
} catch (error) {
  console.error('Failed to cancel:', error);
}
```

## Type Definitions

### RunStatus
```typescript
type RunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";
```

### RunStreamEvent
```typescript
type RunStreamEvent =
  | { type: "stdout"; data: string; timestamp?: string }
  | { type: "stderr"; data: string; timestamp?: string }
  | {
      type: "status";
      data: RunStatus;
      reason?: string;
      timestamp?: string;
    };
```

## Styling

### Status Badge Colors

- `queued`: Amber (`border-amber-500 text-amber-400`)
- `running`: Emerald (`border-emerald-500 text-emerald-400`)
- `succeeded`: Blue (`border-blue-500 text-blue-400`)
- `failed`: Red (`border-red-500 text-red-400`)
- `cancelled`: Gray (`border-gray-500 text-gray-300`)

### Terminal Theme

- Background: `#1e1e1e` (dark gray)
- Foreground: `#ffffff` (white)
- Cursor: `#ffffff` (white)
- Font: Monospace (Menlo, Monaco, Courier New)

## Environment Variables

```bash
# Backend API URL (defaults to http://localhost:4000)
NEXT_PUBLIC_API_URL=http://localhost:4000

# WebSocket authentication token
NEXT_PUBLIC_WS_TOKEN=your-token-here
```

## Integration Example

### Editor Page Integration

```tsx
// app/editor/page.tsx
"use client";

import TerminalComponent from "@/components/TerminalComponent";

export default function EditorPage() {
  const runId = "demo-run";
  const token = process.env.NEXT_PUBLIC_WS_TOKEN;

  return (
    <div className="h-screen flex flex-col">
      {/* Other editor components */}
      
      <div className="h-48 border-t border-[#333]">
        <TerminalComponent runId={runId} token={token} />
      </div>
    </div>
  );
}
```

### Dynamic Run ID

```tsx
function RunViewer({ runId }: { runId: string }) {
  const token = useAuthToken(); // Your auth hook

  return (
    <div className="h-full">
      <TerminalComponent runId={runId} token={token} />
    </div>
  );
}
```

## Error Handling

### Connection Errors

The component handles various error scenarios:

1. **Connection Failure**
   - Displays error message in terminal
   - Logs error to console
   - Socket.IO automatically retries connection

2. **Authentication Failure**
   - Server disconnects client
   - Error message displayed in terminal
   - Check token configuration

3. **Missing Run ID**
   - Server rejects connection
   - Error event emitted
   - Connection closed

### Cancel Errors

```typescript
try {
  await cancelRun(runId);
} catch (error) {
  // Handle error (show toast, log, etc.)
  console.error("Failed to cancel run", error);
}
```

## Performance Considerations

1. **Terminal Rendering**
   - xterm.js efficiently handles large amounts of text
   - Consider limiting buffer size for very long runs
   - FitAddon ensures optimal rendering

2. **WebSocket Reconnection**
   - Socket.IO handles reconnection automatically
   - Consider showing reconnection status to user
   - May want to pause/resume on visibility change

3. **Memory Management**
   - Terminal and socket properly disposed on unmount
   - Event listeners removed
   - Refs cleared

## Customization

### Custom Terminal Theme

```typescript
const term = new Terminal({
  theme: {
    background: "#000000",
    foreground: "#00ff00",
    cursor: "#00ff00",
  },
  // ... other options
});
```

### Custom Status Colors

Modify the `cn()` call in the status badge:

```typescript
className={cn(
  "text-xs rounded-full px-2 py-1 border",
  status === "running" && "border-green-500 text-green-400",
  // ... other status colors
)}
```

### Additional Event Handlers

```typescript
socket.on("custom-event", (data) => {
  // Handle custom events
});
```

## Testing

### Unit Testing

```typescript
import { render, screen } from '@testing-library/react';
import TerminalComponent from '@/components/TerminalComponent';

describe('TerminalComponent', () => {
  it('renders with runId', () => {
    render(<TerminalComponent runId="test-123" />);
    expect(screen.getByText(/test-123/)).toBeInTheDocument();
  });

  it('disables cancel button when run is cancelled', () => {
    // Mock WebSocket to send status update
    // Verify button is disabled
  });
});
```

### Integration Testing

1. Start backend server
2. Create a test run
3. Render component with test runId
4. Verify WebSocket connection
5. Verify logs appear in terminal
6. Test cancel functionality

## Troubleshooting

### Common Issues

1. **Terminal not rendering**
   - Ensure component is mounted (`mounted` state)
   - Check terminalRef is attached to DOM
   - Verify xterm.js CSS is imported

2. **WebSocket not connecting**
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check token matches backend `WS_AUTH_TOKEN`
   - Review browser console for errors

3. **Logs not appearing**
   - Verify backend is sending `run-event` messages
   - Check `runId` matches between frontend and backend
   - Review WebSocket messages in browser DevTools

4. **Cancel button not working**
   - Verify API endpoint is accessible
   - Check network tab for request/response
   - Ensure run is in cancellable state

## Future Enhancements

- [ ] Log filtering/search
- [ ] Copy to clipboard
- [ ] Download logs
- [ ] Terminal input (for interactive commands)
- [ ] Multiple terminal tabs
- [ ] Log persistence
- [ ] Reconnection UI feedback
- [ ] Performance metrics display

