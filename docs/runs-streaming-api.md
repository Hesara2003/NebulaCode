# Runs Streaming - API Reference

## Overview

This document provides a complete reference for the Runs Streaming API, including HTTP endpoints and WebSocket protocol specifications.

## Base URL

```
http://localhost:4000
```

Or use the environment variable:
```bash
NEXT_PUBLIC_API_URL=http://your-backend-url
```

## Authentication

### WebSocket Authentication

WebSocket connections require authentication via token. The token can be provided in three ways:

1. **Authorization Header** (recommended)
   ```
   Authorization: Bearer <token>
   ```

2. **Query Parameter**
   ```
   ws://localhost:4000/runs?token=<token>&runId=<runId>
   ```

3. **Socket.IO Auth Payload**
   ```javascript
   {
     auth: { token: "<token>" }
   }
   ```

**Token Validation:**
- Token must match `WS_AUTH_TOKEN` environment variable
- Default development token: `'devtoken'`
- Invalid tokens result in connection rejection with `unauthorized` error

### HTTP Authentication

Currently, HTTP endpoints do not require authentication. In production, add authentication middleware.

## HTTP Endpoints

### Cancel Run

Cancel an active run and broadcast cancellation status to all connected clients.

**Endpoint:** `POST /runs/:runId/cancel`

**Path Parameters:**
- `runId` (string, required) - The ID of the run to cancel

**Request:**
```http
POST /runs/run-123/cancel HTTP/1.1
Host: localhost:4000
Content-Type: application/json
```

**Response:**

**Success (200 OK):**
```json
{
  "runId": "run-123",
  "status": "cancelled"
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Run not found"
}
```

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Run cannot be cancelled"
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:4000/runs/run-123/cancel
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:4000/runs/run-123/cancel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
console.log(data); // { runId: 'run-123', status: 'cancelled' }
```

**Example (Axios):**
```javascript
import axios from 'axios';

const { data } = await axios.post('/runs/run-123/cancel');
console.log(data); // { runId: 'run-123', status: 'cancelled' }
```

## WebSocket Protocol

### Connection

**Endpoint:** `ws://localhost:4000/runs`

**Path:** `/runs` (Socket.IO path, separate from default `/socket.io`)

**Transport:** WebSocket only (no polling fallback)

**Connection Parameters:**
- `runId` (query parameter, required) - The ID of the run to stream
- `token` (query parameter or auth, required) - Authentication token

**Example Connection (Socket.IO Client):**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  path: '/runs',
  transports: ['websocket'],
  auth: { token: 'your-token' },
  query: { runId: 'run-123', token: 'your-token' },
});
```

**Example Connection (Raw WebSocket):**
```javascript
const ws = new WebSocket('ws://localhost:4000/runs?runId=run-123&token=your-token');
```

### Events

#### Client → Server

No client-to-server events are currently required. The connection itself subscribes to the run stream.

#### Server → Client

##### `run-event`

Broadcast event containing run output or status updates.

**Event Name:** `run-event`

**Payload Types:**

**Stdout Event:**
```typescript
{
  type: 'stdout';
  data: string;           // Output text
  timestamp?: string;      // ISO 8601 timestamp
}
```

**Example:**
```json
{
  "type": "stdout",
  "data": "Hello, World!\n",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Stderr Event:**
```typescript
{
  type: 'stderr';
  data: string;           // Error output text
  timestamp?: string;      // ISO 8601 timestamp
}
```

**Example:**
```json
{
  "type": "stderr",
  "data": "Error: Something went wrong\n",
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

**Status Event:**
```typescript
{
  type: 'status';
  data: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  reason?: string;        // Optional reason for status change
  timestamp?: string;      // ISO 8601 timestamp
}
```

**Example:**
```json
{
  "type": "status",
  "data": "running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example with reason:**
```json
{
  "type": "status",
  "data": "failed",
  "reason": "Process exited with code 1",
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

##### `error`

Error event sent when connection issues occur.

**Event Name:** `error`

**Payload Types:**

**Missing Run ID:**
```json
{
  "error": "missing-run-id"
}
```

**Unauthorized:**
```json
{
  "error": "unauthorized"
}
```

**Example Handler:**
```javascript
socket.on('error', (error) => {
  if (error === 'missing-run-id') {
    console.error('Run ID is required');
  } else if (error === 'unauthorized') {
    console.error('Authentication failed');
  }
});
```

##### `connect`

Standard Socket.IO connection event.

**Event Name:** `connect`

**Example Handler:**
```javascript
socket.on('connect', () => {
  console.log('Connected to run stream');
});
```

##### `disconnect`

Standard Socket.IO disconnection event.

**Event Name:** `disconnect`

**Example Handler:**
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from run stream');
});
```

### Complete Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  path: '/runs',
  transports: ['websocket'],
  auth: { token: 'your-token' },
  query: { runId: 'run-123', token: 'your-token' },
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected to run stream');
});

// Handle run events
socket.on('run-event', (event) => {
  switch (event.type) {
    case 'stdout':
      console.log('STDOUT:', event.data);
      break;
    case 'stderr':
      console.error('STDERR:', event.data);
      break;
    case 'status':
      console.log('STATUS:', event.data, event.reason || '');
      break;
  }
});

// Handle errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected');
});

// Cleanup
socket.disconnect();
```

## TypeScript Types

### RunStatus
```typescript
type RunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';
```

### RunStreamEvent
```typescript
type RunStreamEvent =
  | { type: 'stdout'; data: string; timestamp?: string }
  | { type: 'stderr'; data: string; timestamp?: string }
  | {
      type: 'status';
      data: RunStatus;
      reason?: string;
      timestamp?: string;
    };
```

## Error Codes

### HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request (e.g., run cannot be cancelled)
- `401 Unauthorized` - Authentication required (future)
- `404 Not Found` - Run not found
- `500 Internal Server Error` - Server error

### WebSocket Error Codes

- `missing-run-id` - Run ID not provided in connection
- `unauthorized` - Invalid or missing authentication token

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding:

- Per-client connection limits
- Per-run connection limits
- Message rate limits

## Best Practices

### Connection Management

1. **Always disconnect on component unmount**
   ```javascript
   useEffect(() => {
     const socket = io(...);
     return () => socket.disconnect();
   }, []);
   ```

2. **Handle reconnection**
   ```javascript
   socket.on('disconnect', () => {
     // Handle disconnection, show UI feedback
   });
   ```

3. **Handle connection errors**
   ```javascript
   socket.on('connect_error', (error) => {
     // Log error, show user-friendly message
   });
   ```

### Event Handling

1. **Type-check events**
   ```typescript
   socket.on('run-event', (event: RunStreamEvent) => {
     if (event.type === 'stdout') {
       // Handle stdout
     }
   });
   ```

2. **Handle missing fields**
   ```typescript
   const timestamp = event.timestamp || new Date().toISOString();
   ```

3. **Buffer events if needed**
   ```typescript
   const eventBuffer: RunStreamEvent[] = [];
   socket.on('run-event', (event) => {
     eventBuffer.push(event);
     // Process buffer when ready
   });
   ```

### Error Handling

1. **Always handle errors**
   ```javascript
   try {
     await cancelRun(runId);
   } catch (error) {
     // Handle error appropriately
   }
   ```

2. **Provide user feedback**
   ```javascript
   socket.on('error', (error) => {
     if (error === 'unauthorized') {
       showToast('Authentication failed. Please refresh.');
     }
   });
   ```

## Testing

### Testing HTTP Endpoints

```bash
# Test cancel endpoint
curl -X POST http://localhost:4000/runs/test-123/cancel

# Test with authentication (future)
curl -X POST \
  -H "Authorization: Bearer your-token" \
  http://localhost:4000/runs/test-123/cancel
```

### Testing WebSocket

**Using wscat:**
```bash
npm install -g wscat
wscat -c "ws://localhost:4000/runs?runId=test-123&token=devtoken"
```

**Using browser console:**
```javascript
const socket = io('http://localhost:4000', {
  path: '/runs',
  query: { runId: 'test-123', token: 'devtoken' },
});

socket.on('run-event', console.log);
```

## Changelog

### v1.0.0 (Current)
- Initial implementation
- WebSocket streaming for stdout/stderr/status
- Cancel endpoint
- Token-based authentication

## Future API Enhancements

- [ ] Run creation endpoint (`POST /runs`)
- [ ] Run status endpoint (`GET /runs/:runId`)
- [ ] Run list endpoint (`GET /runs`)
- [ ] Run logs endpoint (`GET /runs/:runId/logs`)
- [ ] JWT authentication
- [ ] WebSocket reconnection with state sync
- [ ] Run metadata (duration, resource usage, etc.)

