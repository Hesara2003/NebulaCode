# Runs Streaming - Backend Implementation Guide

## Overview

The backend implementation provides a WebSocket-based streaming system for run logs and status updates. It's built using NestJS and Socket.IO, with proper authentication and multi-client support.

## Architecture

### Module Structure

```
RunsModule
├── RunsGateway      (WebSocket Gateway)
├── RunsService      (Business Logic)
└── RunsController   (HTTP Endpoints)
```

### Key Components

#### 1. RunsGateway (`runs.gateway.ts`)

The WebSocket gateway handles incoming connections and routes them to the appropriate run stream.

**Key Features:**
- Uses dedicated Socket.IO path `/runs` to avoid conflicts
- Protected by `WsAuthGuard` for authentication
- Extracts `runId` from query parameters
- Registers clients with `RunsService`

**Connection Flow:**
1. Client connects to WebSocket endpoint
2. `WsAuthGuard` validates token
3. Gateway extracts `runId` from query
4. Client registered with `RunsService`
5. Client can now receive `run-event` messages

**Code Example:**
```typescript
@UseGuards(WsAuthGuard)
@WebSocketGateway({
  path: '/runs',
  cors: { origin: true },
  transports: ['websocket'],
})
export class RunsGateway {
  handleConnection(client: Socket) {
    const runId = this.extractRunId(client);
    if (!runId) {
      client.emit('error', 'missing-run-id');
      client.disconnect();
      return;
    }
    this.runsService.registerClient(runId, client);
  }
}
```

#### 2. RunsService (`runs.service.ts`)

Manages client connections and broadcasts messages to all connected clients for a run.

**Data Structures:**
- `runClients: Map<string, Set<Socket>>` - Maps runId to connected clients
- `clientRunIndex: Map<string, string>` - Maps client ID to runId for cleanup

**Public Methods:**

##### `registerClient(runId: string, client: Socket)`
Registers a client connection for a specific run.

```typescript
registerClient(runId: string, client: Socket) {
  const clients = this.runClients.get(runId) ?? new Set<Socket>();
  clients.add(client);
  this.runClients.set(runId, clients);
  this.clientRunIndex.set(client.id, runId);
}
```

##### `unregisterClient(client: Socket)`
Removes a client when it disconnects.

```typescript
unregisterClient(client: Socket) {
  const runId = this.clientRunIndex.get(client.id);
  if (!runId) return;
  
  const clients = this.runClients.get(runId);
  clients?.delete(client);
  if (clients && clients.size === 0) {
    this.runClients.delete(runId);
  }
  this.clientRunIndex.delete(client.id);
}
```

##### `sendStdout(runId: string, data: string)`
Broadcasts stdout data to all clients watching a run.

```typescript
sendStdout(runId: string, data: string) {
  this.broadcast(runId, {
    type: 'stdout',
    data,
    timestamp: new Date().toISOString(),
  });
}
```

##### `sendStderr(runId: string, data: string)`
Broadcasts stderr data to all clients watching a run.

```typescript
sendStderr(runId: string, data: string) {
  this.broadcast(runId, {
    type: 'stderr',
    data,
    timestamp: new Date().toISOString(),
  });
}
```

##### `sendStatus(runId: string, status: RunStatus, reason?: string)`
Broadcasts status updates to all clients.

```typescript
sendStatus(runId: string, status: RunStatus, reason?: string) {
  this.broadcast(runId, {
    type: 'status',
    data: status,
    reason,
    timestamp: new Date().toISOString(),
  });
}
```

**Private Methods:**

##### `broadcast(runId: string, payload: RunStreamEvent)`
Internal method that emits `run-event` to all connected clients.

```typescript
private broadcast(runId: string, payload: RunStreamEvent) {
  const clients = this.runClients.get(runId);
  if (!clients) return;
  clients.forEach((client) => client.emit('run-event', payload));
}
```

#### 3. RunsController (`runs.controller.ts`)

HTTP REST controller for run management endpoints.

**Endpoints:**

##### `POST /runs/:runId/cancel`
Cancels an active run and broadcasts cancellation status.

```typescript
@Post(':runId/cancel')
cancelRun(@Param('runId') runId: string) {
  this.runsService.sendStatus(runId, 'cancelled', 'Cancelled by user');
  return { runId, status: 'cancelled' as const };
}
```

**Response:**
```json
{
  "runId": "run-123",
  "status": "cancelled"
}
```

#### 4. WsAuthGuard (`auth/ws-auth.guard.ts`)

Authentication guard that validates WebSocket connections.

**Token Extraction Order:**
1. `Authorization: Bearer <token>` header
2. `?token=<token>` query parameter
3. `auth.token` in Socket.IO auth payload

**Validation:**
- Compares token against `WS_AUTH_TOKEN` environment variable
- Defaults to `'devtoken'` if not set (development only)
- Rejects connection with `unauthorized` error if invalid

**Code Example:**
```typescript
@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);
    const expectedToken = process.env.WS_AUTH_TOKEN ?? 'devtoken';

    if (!token || token !== expectedToken) {
      client.emit('error', 'unauthorized');
      client.disconnect();
      throw new UnauthorizedException('Invalid websocket token');
    }

    client.data = { ...(client.data || {}), token };
    return true;
  }
}
```

## Type Definitions

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

## Integration with Run Execution

To integrate with your run execution system, inject `RunsService` and call the appropriate methods:

```typescript
import { RunsService } from './runs/runs.service';

@Injectable()
export class ExecutionService {
  constructor(private readonly runsService: RunsService) {}

  async executeRun(runId: string, command: string) {
    // Send initial status
    this.runsService.sendStatus(runId, 'running');

    // Start execution process
    const process = spawn(command);

    // Stream stdout
    process.stdout.on('data', (data) => {
      this.runsService.sendStdout(runId, data.toString());
    });

    // Stream stderr
    process.stderr.on('data', (data) => {
      this.runsService.sendStderr(runId, data.toString());
    });

    // Handle completion
    process.on('close', (code) => {
      const status = code === 0 ? 'succeeded' : 'failed';
      this.runsService.sendStatus(runId, status);
    });
  }
}
```

## Error Handling

### Connection Errors

- **Missing runId:** Client receives `error: 'missing-run-id'` and is disconnected
- **Invalid token:** Client receives `error: 'unauthorized'` and is disconnected
- **Server errors:** Logged via NestJS Logger, clients may receive generic errors

### Best Practices

1. **Always check for clients before broadcasting**
   - The `broadcast` method safely handles missing clients
   - No errors thrown if no clients are connected

2. **Clean up on disconnect**
   - `unregisterClient` is called automatically on disconnect
   - Prevents memory leaks from stale connections

3. **Use status updates for state changes**
   - Always send status updates when run state changes
   - Include reason for failures/cancellations

## Environment Variables

```bash
# WebSocket authentication token
WS_AUTH_TOKEN=your-secure-token-here

# Default (development only)
WS_AUTH_TOKEN=devtoken
```

## Testing

### Manual Testing

1. **Test WebSocket Connection:**
   ```bash
   # Using wscat or similar tool
   wscat -c "ws://localhost:4000/runs?runId=test-123&token=devtoken"
   ```

2. **Test Cancel Endpoint:**
   ```bash
   curl -X POST http://localhost:4000/runs/test-123/cancel
   ```

3. **Test Authentication:**
   - Try connecting without token (should fail)
   - Try connecting with wrong token (should fail)
   - Try connecting with correct token (should succeed)

### Unit Testing

Example test structure:

```typescript
describe('RunsService', () => {
  let service: RunsService;
  let mockSocket: Socket;

  beforeEach(() => {
    service = new RunsService();
    mockSocket = createMockSocket();
  });

  it('should register client', () => {
    service.registerClient('run-123', mockSocket);
    // Verify client is registered
  });

  it('should broadcast to all clients', () => {
    service.registerClient('run-123', mockSocket);
    service.sendStdout('run-123', 'test output');
    // Verify mockSocket.emit was called
  });
});
```

## Performance Considerations

1. **Memory Management**
   - Clients are automatically cleaned up on disconnect
   - Empty run entries are removed when last client disconnects

2. **Broadcasting Efficiency**
   - Uses Set for O(1) client lookup
   - Direct emit to each client (no intermediate buffering)

3. **Scalability**
   - Each run maintains its own client set
   - No global state that could become a bottleneck
   - Consider Redis adapter for multi-instance deployments

## Security Considerations

1. **Token Validation**
   - Always validate tokens in production
   - Use strong, randomly generated tokens
   - Consider JWT for more sophisticated auth

2. **Run ID Validation**
   - Consider validating runId format/existence
   - Implement rate limiting per client
   - Add authorization checks (user can only access their runs)

3. **CORS Configuration**
   - Currently allows all origins (`origin: true`)
   - Restrict to specific domains in production

## Troubleshooting

### Common Issues

1. **"handleUpgrade() was called more than once"**
   - Ensure only one gateway uses the same Socket.IO path
   - Check for conflicting WebSocket configurations

2. **Clients not receiving messages**
   - Verify client is registered (check logs)
   - Ensure `runId` matches between sender and receiver
   - Check WebSocket connection is active

3. **Authentication failures**
   - Verify `WS_AUTH_TOKEN` matches between frontend and backend
   - Check token is being sent correctly (header/query/auth)
   - Review guard logs for extraction issues

## Future Enhancements

- [ ] JWT-based authentication
- [ ] Run history/replay
- [ ] Rate limiting per client
- [ ] Redis adapter for horizontal scaling
- [ ] Run metadata (start time, duration, etc.)
- [ ] Filtering/searching logs
- [ ] Log persistence to database

