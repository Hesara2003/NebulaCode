import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Socket } from 'socket.io';

/**
 * Minimal WS auth guard that validates a bearer token passed in the
 * websocket handshake (header, query, or auth payload). In a real system
 * this should delegate to your auth service / JWT verification.
 */
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

  private extractToken(client: Socket): string | undefined {
    const authHeader = client.handshake?.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length);
    }

    const queryToken = client.handshake?.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    const authToken = (client.handshake as any)?.auth?.token;
    if (typeof authToken === 'string') {
      return authToken;
    }

    return undefined;
  }
}

