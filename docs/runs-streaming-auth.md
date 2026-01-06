# Runs Streaming - Authentication Guide

## Overview

The Runs Streaming feature uses token-based authentication for WebSocket connections. This document explains how authentication works, how to configure it, and how to integrate it with your authentication system.

## Current Implementation

### Token-Based Authentication

The current implementation uses a simple token comparison system:

1. **Token Extraction:** The `WsAuthGuard` extracts tokens from three possible locations
2. **Token Validation:** Compares extracted token against `WS_AUTH_TOKEN` environment variable
3. **Connection Handling:** Accepts or rejects connection based on validation

### Token Sources (Priority Order)

The guard checks for tokens in this order:

1. **Authorization Header** (highest priority)
   ```
   Authorization: Bearer <token>
   ```

2. **Query Parameter**
   ```
   ?token=<token>
   ```

3. **Socket.IO Auth Payload**
   ```javascript
   {
     auth: { token: "<token>" }
   }
   ```

## Configuration

### Backend Configuration

Set the `WS_AUTH_TOKEN` environment variable:

```bash
# .env file
WS_AUTH_TOKEN=your-secure-random-token-here
```

**Development Default:**
If `WS_AUTH_TOKEN` is not set, it defaults to `'devtoken'` (development only).

**Production:**
Always set a strong, randomly generated token in production:

```bash
# Generate a secure token
openssl rand -hex 32

# Set in environment
export WS_AUTH_TOKEN=$(openssl rand -hex 32)
```

### Frontend Configuration

Set the `NEXT_PUBLIC_WS_TOKEN` environment variable to match the backend:

```bash
# .env.local file
NEXT_PUBLIC_WS_TOKEN=your-secure-random-token-here
```

**Important:** The frontend token must match the backend token exactly.

## Implementation Details

### WsAuthGuard

**Location:** `backend/src/auth/ws-auth.guard.ts`

**How it works:**

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

**Token Extraction:**

```typescript
private extractToken(client: Socket): string | undefined {
  // 1. Check Authorization header
  const authHeader = client.handshake?.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  // 2. Check query parameter
  const queryToken = client.handshake?.query?.token;
  if (typeof queryToken === 'string') {
    return queryToken;
  }

  // 3. Check auth payload
  const authToken = (client.handshake as any)?.auth?.token;
  if (typeof authToken === 'string') {
    return authToken;
  }

  return undefined;
}
```

### Applying the Guard

The guard is applied to the `RunsGateway`:

```typescript
@UseGuards(WsAuthGuard)
@WebSocketGateway({
  path: '/runs',
  cors: { origin: true },
  transports: ['websocket'],
})
export class RunsGateway {
  // ...
}
```

## Usage Examples

### Frontend Connection

**Using Socket.IO Client:**

```typescript
import { io } from 'socket.io-client';

const token = process.env.NEXT_PUBLIC_WS_TOKEN;

const socket = io('http://localhost:4000', {
  path: '/runs',
  transports: ['websocket'],
  auth: { token },                    // Method 1: Auth payload
  query: { runId: 'run-123', token }, // Method 2: Query parameter
});
```

**With Authorization Header:**

Socket.IO doesn't directly support custom headers in the browser. For header-based auth, you'd need to:

1. Use a custom transport adapter
2. Or rely on query/auth payload methods

### Backend Integration

**Injecting Token into Client Data:**

After successful authentication, the token is stored in `client.data`:

```typescript
// In RunsGateway or RunsService
handleConnection(client: Socket) {
  const token = client.data.token; // Available after guard validation
  const runId = this.extractRunId(client);
  // Use token for additional authorization checks
}
```

## Security Considerations

### Current Limitations

1. **Simple Token Comparison**
   - No expiration
   - No revocation
   - No user context

2. **Token Exposure**
   - Tokens in query strings may be logged
   - Tokens in frontend code are visible to users

3. **No User Authorization**
   - Doesn't verify user can access specific runs
   - All authenticated users can access all runs

### Best Practices

1. **Use Strong Tokens**
   ```bash
   # Generate cryptographically secure token
   openssl rand -hex 32
   ```

2. **Rotate Tokens Regularly**
   - Change `WS_AUTH_TOKEN` periodically
   - Update frontend token simultaneously

3. **Use HTTPS/WSS in Production**
   - Encrypts token in transit
   - Prevents token interception

4. **Avoid Query Parameters**
   - Prefer Authorization header or auth payload
   - Query parameters may be logged in server logs

5. **Implement Token Expiration**
   - See "Upgrading to JWT" section below

## Upgrading to JWT Authentication

For production use, consider upgrading to JWT-based authentication:

### 1. Update WsAuthGuard

```typescript
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      client.emit('error', 'unauthorized');
      client.disconnect();
      throw new UnauthorizedException('Missing token');
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data = { ...(client.data || {}), user: payload };
      return true;
    } catch (error) {
      client.emit('error', 'unauthorized');
      client.disconnect();
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### 2. Add User Context

```typescript
// In RunsGateway
handleConnection(client: Socket) {
  const user = client.data.user; // From JWT payload
  const runId = this.extractRunId(client);
  
  // Verify user can access this run
  if (!this.canUserAccessRun(user.id, runId)) {
    client.emit('error', 'forbidden');
    client.disconnect();
    return;
  }
  
  this.runsService.registerClient(runId, client);
}
```

### 3. Frontend JWT Usage

```typescript
import { io } from 'socket.io-client';
import { getAuthToken } from '@/lib/auth'; // Your auth helper

const token = getAuthToken(); // Get JWT from your auth system

const socket = io('http://localhost:4000', {
  path: '/runs',
  auth: { token },
  query: { runId: 'run-123' },
});
```

## Integration with Existing Auth System

### If You Have User Sessions

```typescript
// In your auth service
export class AuthService {
  generateWsToken(userId: string): string {
    // Generate a short-lived token for WebSocket
    return this.jwtService.sign(
      { userId, type: 'ws' },
      { expiresIn: '1h' }
    );
  }
}

// In your HTTP auth endpoint
@Get('ws-token')
@UseGuards(AuthGuard)
getWsToken(@Request() req) {
  return {
    token: this.authService.generateWsToken(req.user.id),
  };
}
```

### Frontend Token Retrieval

```typescript
// In your component
const [wsToken, setWsToken] = useState<string | null>(null);

useEffect(() => {
  // Fetch WebSocket token from your auth endpoint
  fetch('/auth/ws-token')
    .then(res => res.json())
    .then(data => setWsToken(data.token));
}, []);

// Use token in Socket.IO connection
const socket = io('http://localhost:4000', {
  path: '/runs',
  auth: { token: wsToken },
  query: { runId },
});
```

## Testing Authentication

### Test Valid Token

```javascript
const socket = io('http://localhost:4000', {
  path: '/runs',
  query: { runId: 'test-123', token: 'devtoken' },
});

socket.on('connect', () => {
  console.log('Connected successfully');
});
```

### Test Invalid Token

```javascript
const socket = io('http://localhost:4000', {
  path: '/runs',
  query: { runId: 'test-123', token: 'wrong-token' },
});

socket.on('error', (error) => {
  console.log('Error:', error); // Should be 'unauthorized'
});

socket.on('disconnect', () => {
  console.log('Disconnected due to auth failure');
});
```

### Test Missing Token

```javascript
const socket = io('http://localhost:4000', {
  path: '/runs',
  query: { runId: 'test-123' }, // No token
});

socket.on('error', (error) => {
  console.log('Error:', error); // Should be 'unauthorized'
});
```

## Troubleshooting

### Common Issues

1. **"unauthorized" Error**
   - Verify `WS_AUTH_TOKEN` matches `NEXT_PUBLIC_WS_TOKEN`
   - Check token is being sent correctly
   - Review guard logs for extraction issues

2. **Token Not Found**
   - Verify token is in one of the three supported locations
   - Check Socket.IO handshake in browser DevTools
   - Ensure token is not empty or undefined

3. **Connection Rejected**
   - Check environment variables are set
   - Verify guard is applied to gateway
   - Review server logs for detailed errors

### Debugging

**Enable Debug Logging:**

```typescript
// In WsAuthGuard
private readonly logger = new Logger(WsAuthGuard.name);

canActivate(context: ExecutionContext): boolean {
  const client = context.switchToWs().getClient<Socket>();
  const token = this.extractToken(client);
  
  this.logger.debug(`Extracted token: ${token ? 'present' : 'missing'}`);
  this.logger.debug(`Expected token: ${process.env.WS_AUTH_TOKEN ? 'set' : 'not set'}`);
  
  // ... rest of validation
}
```

**Check Socket.IO Handshake:**

```typescript
// In RunsGateway
handleConnection(client: Socket) {
  console.log('Handshake headers:', client.handshake.headers);
  console.log('Handshake query:', client.handshake.query);
  console.log('Handshake auth:', client.handshake.auth);
}
```

## Migration Guide

### From No Auth to Token Auth

1. Set `WS_AUTH_TOKEN` environment variable
2. Set `NEXT_PUBLIC_WS_TOKEN` in frontend
3. Update frontend to send token in connection
4. Test connection with token

### From Token Auth to JWT Auth

1. Install `@nestjs/jwt` and `@nestjs/passport`
2. Update `WsAuthGuard` to use JWT verification
3. Update frontend to use JWT tokens
4. Add user context to client data
5. Implement run authorization checks

## Future Enhancements

- [ ] JWT-based authentication
- [ ] Token refresh mechanism
- [ ] User-specific run authorization
- [ ] Rate limiting per user
- [ ] Audit logging for connections
- [ ] Token revocation support

