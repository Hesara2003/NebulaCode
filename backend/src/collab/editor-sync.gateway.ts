import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { applyUpdate, Doc, encodeStateAsUpdate } from 'yjs';

export type PresenceParticipant = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

@WebSocketGateway({
  namespace: 'editor-sync',
  cors: {
    origin: '*',
  },
})
export class EditorSyncGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(EditorSyncGateway.name);
  private readonly participants = new Map<string, PresenceParticipant>();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  private readonly document = new Doc();

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

  @SubscribeMessage('document:join')
  handleDocumentJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() stateVector?: ArrayBuffer,
  ): void {
    try {
      const encodedStateVector =
        stateVector instanceof ArrayBuffer
          ? new Uint8Array(stateVector)
          : undefined;
      let update: Uint8Array;

      if (encodedStateVector !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        update = encodeStateAsUpdate(this.document, encodedStateVector);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        update = encodeStateAsUpdate(this.document);
      }

      if (update.byteLength > 0) {
        client.emit('document:sync', update);
      }

      // Ensure the new client receives the latest presence snapshot as well.
      client.emit('presence:update', Array.from(this.participants.values()));
    } catch (error) {
      this.logger.error(
        `Failed to produce sync update for client ${client.id}: ${error}`,
      );
    }
  }

  @SubscribeMessage('document:update')
  handleDocumentUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ArrayBuffer,
  ): void {
    try {
      if (!(payload instanceof ArrayBuffer)) {
        this.logger.warn(
          `Ignoring malformed document update from ${client.id}`,
        );
        return;
      }

      const update = new Uint8Array(payload);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      applyUpdate(this.document, update, client.id);
      client.broadcast.emit('document:update', update);
    } catch (error) {
      this.logger.error(
        `Failed to handle document update from ${client.id}: ${error}`,
      );
    }
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
      initials: this.ensureString(auth.initials) ?? this.deriveInitials(name),
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
    const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';

    return `${first}${second}`.toUpperCase();
  }
}
