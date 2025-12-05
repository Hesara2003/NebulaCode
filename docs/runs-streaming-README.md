# Runs Streaming Feature - Complete Documentation

## 📚 Documentation Index

This is the main documentation hub for the Runs Streaming feature. All documentation is organized into focused guides:

### Core Documentation

1. **[Overview](./runs-streaming-overview.md)** - Start here!
   - Feature overview and architecture
   - Quick start guide
   - File structure
   - Technology stack

2. **[Backend Implementation](./runs-streaming-backend.md)**
   - Detailed backend architecture
   - Component explanations
   - Integration patterns
   - Testing guide

3. **[Frontend Implementation](./runs-streaming-frontend.md)**
   - Component usage
   - WebSocket integration
   - UI customization
   - Error handling

4. **[API Reference](./runs-streaming-api.md)**
   - HTTP endpoints
   - WebSocket protocol
   - TypeScript types
   - Code examples

5. **[Authentication Guide](./runs-streaming-auth.md)**
   - Token-based auth
   - Configuration
   - Security best practices
   - JWT migration guide

6. **[Integration Guide](./runs-streaming-integration.md)**
   - Step-by-step integration
   - Common patterns
   - Testing strategies
   - Troubleshooting

## 🚀 Quick Start

### Backend Setup

```bash
cd backend

# Set environment variable
export WS_AUTH_TOKEN=your-secure-token

# Start server
npm run start:dev
```

### Frontend Setup

```bash
cd frontend

# Set environment variables
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" >> .env.local
echo "NEXT_PUBLIC_WS_TOKEN=your-secure-token" >> .env.local

# Start dev server
npm run dev
```

### Basic Usage

```tsx
import TerminalComponent from '@/components/TerminalComponent';

function MyPage() {
  return (
    <TerminalComponent 
      runId="run-123" 
      token={process.env.NEXT_PUBLIC_WS_TOKEN} 
    />
  );
}
```

## 📋 Feature Checklist

### ✅ Implemented

- [x] WebSocket streaming for stdout/stderr
- [x] Real-time status updates
- [x] Run cancellation endpoint
- [x] Token-based authentication
- [x] Multi-client support
- [x] xterm.js terminal UI
- [x] Cancel button with loading states
- [x] Status badges with color coding


## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend    │────────▶│  Run Exec   │
│  Terminal   │◀────────│   Gateway    │◀────────│   Service   │
└─────────────┘         └──────────────┘         └─────────────┘
     │                        │                          │
     │  WebSocket Stream      │  HTTP POST               │
     │  (stdout/stderr/status)│  /runs/:id/cancel        │
     │                        │                          │
     └────────────────────────┴──────────────────────────┘
```

## 📁 File Structure

```
backend/src/
├── runs/
│   ├── runs.gateway.ts      # WebSocket gateway
│   ├── runs.service.ts      # Client management & broadcasting
│   ├── runs.controller.ts   # HTTP endpoints
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

## 🔑 Key Concepts

### Run Status Lifecycle

```
queued → running → succeeded/failed/cancelled
```

### Message Types

- **stdout**: Standard output (white text)
- **stderr**: Error output (red text)
- **status**: Status updates (cyan prefix)

### Authentication

- Token-based authentication
- Supports Bearer header, query param, or auth payload
- Validated via `WsAuthGuard`

## 📖 Usage Examples

### Backend: Send Logs

```typescript
// In your execution service
this.runsService.sendStdout(runId, 'Hello, World!\n');
this.runsService.sendStderr(runId, 'Error occurred\n');
this.runsService.sendStatus(runId, 'running');
```

### Frontend: Connect to Stream

```typescript
const socket = io('http://localhost:4000', {
  path: '/runs',
  auth: { token: 'your-token' },
  query: { runId: 'run-123' },
});

socket.on('run-event', (event) => {
  if (event.type === 'stdout') {
    console.log(event.data);
  }
});
```

### Cancel a Run

```typescript
import { cancelRun } from '@/lib/api/runs';

await cancelRun('run-123');
```

## 🧪 Testing

### Test WebSocket Connection

```bash
wscat -c "ws://localhost:4000/runs?runId=test-123&token=devtoken"
```

### Test Cancel Endpoint

```bash
curl -X POST http://localhost:4000/runs/test-123/cancel
```

## 🔒 Security

- **Development**: Default token `'devtoken'`
- **Production**: Set strong `WS_AUTH_TOKEN`
- **Best Practice**: Use JWT for production (see auth guide)

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket not connecting**
   - Check token matches between frontend/backend
   - Verify `WS_AUTH_TOKEN` is set
   - Review CORS configuration

2. **Logs not appearing**
   - Verify backend is sending `run-event` messages
   - Check `runId` matches
   - Review WebSocket messages in DevTools

3. **Cancel not working**
   - Verify API endpoint is accessible
   - Check run is in cancellable state
   - Review network tab for errors

## 📞 Support

For questions or issues:

1. Check the relevant documentation guide
2. Review troubleshooting sections
3. Check code examples
4. Review implementation files

## 🔗 Related Documentation

- [Editor System](./editor-system.md) - Collaboration features
- [Workspace API](../README.md) - Workspace management

## 📝 Changelog

### v1.0.0 (Current)
- Initial implementation
- WebSocket streaming
- Cancel functionality
- Token authentication
- Multi-client support

---

**Last Updated:** 2024-01-15  
**Maintained By:** NebulaCode Team

