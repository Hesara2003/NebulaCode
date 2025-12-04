import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export type PresenceParticipant = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

@WebSocketGateway({
  namespace: 'editor-sync',
  path: '/editor-sync/socket.io',
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class EditorSyncGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(EditorSyncGateway.name);
  private readonly participants = new Map<string, PresenceParticipant>();

  handleConnection(client: Socket): void {
    const participant = this.extractParticipant(client);
    this.participants.set(client.id, participant);
    this.logger.log(`Client connected: ${client.id} (${participant.name})`);
    this.broadcastPresence();
  }

  handleDisconnect(client: Socket): void {
    const participant = this.participants.get(client.id);
    this.participants.delete(client.id);
    this.logger.log(
      `Client disconnected: ${client.id}${
        participant ? ` (${participant.name})` : ''
      }`,
    );
    this.broadcastPresence();
  }

  private broadcastPresence(): void {
    const participants = Array.from(this.participants.values());
    this.logger.debug(
      `Broadcasting presence to ${participants.length} participants`,
    );
    this.server.emit('presence:update', participants);
  }

  private extractParticipant(client: Socket): PresenceParticipant {
    const auth = (client.handshake.auth ?? client.handshake.query) as Record<
      string,
      unknown
    >;
    const name = this.ensureString(auth.name) ?? 'Guest';
    return {
      id: this.ensureString(auth.userId) ?? client.id,
      name,
      initials:
        this.ensureString(auth.initials) ?? this.deriveInitials(name),
      color: this.ensureString(auth.color) ?? '#6366F1',
    };
  }

  private ensureString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0
      ? value
      : undefined;
  }

  private deriveInitials(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'NN';
    }

    const parts = trimmed.split(/\s+/);
    const first = parts[0]?.[0] ?? 'N';
    const second =
      parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';

    return `${first}${second}`.toUpperCase();
  }
}
