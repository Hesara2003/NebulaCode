# Runs Streaming Feature - Overview

## Introduction

This document provides a comprehensive overview of the **Runs Streaming** feature implemented in NebulaCode. This feature enables real-time streaming of execution logs (stdout, stderr) and status updates for code runs via WebSocket connections, with support for canceling active runs.

## Features

### ✅ Implemented Features

1. **Real-time Log Streaming**
   - Stream stdout and stderr output from code executions in real-time
   - Display logs in an xterm.js terminal component
   - Color-coded output (stdout in white, stderr in red)

2. **Status Updates**
   - Track run status: `queued`, `running`, `succeeded`, `failed`, `cancelled`
   - Real-time status updates broadcast to all connected clients
   - Visual status indicators with color-coded badges

3. **Run Cancellation**
   - Cancel active runs via HTTP POST endpoint
   - Automatic status update broadcast when cancellation is requested
   - UI button with loading states and disabled states for terminal states

4. **WebSocket Authentication**
   - Token-based authentication for WebSocket connections
   - Support for Bearer token in headers, query params, or auth payload
   - Automatic connection rejection for invalid tokens

5. **Multi-Client Support**
   - Multiple clients can connect to the same run stream
   - Broadcast messages to all connected clients for a given run
   - Automatic cleanup when clients disconnect

## Architecture

### High-Level Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend    │────────▶│  Run Exec   │
│  Terminal   │◀────────│   Gateway    │◀────────│   Service   │
└─────────────┘         └──────────────┘         └─────────────┘
     │                        │                          │
     │                        │                          │
     │  WebSocket Stream      │  HTTP POST               │
     │  (stdout/stderr/status)│  /runs/:id/cancel        │
     │                        │                          │
     └────────────────────────┴──────────────────────────┘
```

### Component Overview

**Backend:**
- `RunsGateway` - WebSocket gateway handling connections
- `RunsService` - Service managing client connections and broadcasting
- `RunsController` - HTTP controller for cancel endpoint
- `WsAuthGuard` - Authentication guard for WebSocket connections

**Frontend:**
- `TerminalComponent` - React component with xterm.js integration
- `runs.ts` API client - HTTP client for cancel endpoint
- Socket.IO client - WebSocket client for streaming

## Technology Stack

- **Backend:** NestJS, Socket.IO, TypeScript
- **Frontend:** Next.js, React, xterm.js, Socket.IO Client
- **Protocol:** WebSocket (Socket.IO), HTTP REST

## Quick Start

### Backend Setup

1. Ensure `RunsModule` is imported in `AppModule`
2. Set environment variable `WS_AUTH_TOKEN` (defaults to `'devtoken'`)
3. Start the backend server

### Frontend Setup

1. Set `NEXT_PUBLIC_WS_TOKEN` environment variable to match backend token
2. Use `TerminalComponent` with required props:
   ```tsx
   <TerminalComponent runId="your-run-id" token="your-token" />
   ```

## File Structure

```
backend/src/
├── runs/
│   ├── runs.gateway.ts      # WebSocket gateway
│   ├── runs.service.ts      # Service for client management
│   ├── runs.controller.ts   # HTTP controller
│   ├── runs.module.ts       # NestJS module
│   └── runs.types.ts        # TypeScript types
└── auth/
    └── ws-auth.guard.ts     # WebSocket auth guard

frontend/
├── components/
│   └── TerminalComponent.tsx  # Terminal UI component
└── lib/api/
    └── runs.ts                 # API client
```

## Next Steps

- See [Backend Implementation Guide](./runs-streaming-backend.md) for detailed backend documentation
- See [Frontend Implementation Guide](./runs-streaming-frontend.md) for frontend integration details
- See [API Reference](./runs-streaming-api.md) for API endpoints and WebSocket protocol
- See [Authentication Guide](./runs-streaming-auth.md) for auth implementation details

