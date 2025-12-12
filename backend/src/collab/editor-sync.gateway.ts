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

type DocumentJoinPayload = {
  documentId?: unknown;
  stateVector?: unknown;
};

type DocumentUpdatePayload = {
  documentId?: unknown;
  update?: unknown;
};

type DocumentLeavePayload = {
  documentId?: unknown;
};

@WebSocketGateway({
  namespace: 'editor-sync',
  cors: {
    origin: [
      ...(process.env.COLLAB_ALLOWED_ORIGINS?.split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0) ?? []),
      /localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
    ],
    credentials: true,
  },
})
export class EditorSyncGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(EditorSyncGateway.name);
  private readonly participants = new Map<string, PresenceParticipant>();
  private readonly documents = new Map<string, Doc>();
  private readonly clientDocuments = new Map<string, Set<string>>();
  private readonly documentParticipants = new Map<string, Set<string>>();

  handleConnection(client: Socket): void {
    const participant = this.extractParticipant(client);
    this.participants.set(client.id, participant);
    this.logger.log(`Client connected: ${client.id} (${participant.name})`);
    this.broadcastPresence();
  }

  handleDisconnect(client: Socket): void {
    const participant = this.participants.get(client.id);
    this.participants.delete(client.id);

    const joinedDocuments = this.clientDocuments.get(client.id);
    if (joinedDocuments) {
      joinedDocuments.forEach((documentId) => {
        void client.leave(this.roomName(documentId));
        const participants = this.documentParticipants.get(documentId);
        if (participants) {
          participants.delete(client.id);
          if (participants.size === 0) {
            this.documentParticipants.delete(documentId);
          }
        }
      });
      this.clientDocuments.delete(client.id);
    }
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
    @MessageBody() payload?: DocumentJoinPayload,
  ): void {
    try {
      const documentId = this.ensureString(payload?.documentId);
      if (!documentId) {
        this.logger.warn(
          `Client ${client.id} attempted to join document with invalid id: ${String(
            payload?.documentId,
          )}`,
        );
        return;
      }

      const stateVector = this.ensureUint8Array(payload?.stateVector);
      const document = this.getOrCreateDocument(documentId);

      let update: Uint8Array;

      if (stateVector) {
        update = encodeStateAsUpdate(document, stateVector);
      } else {
        update = encodeStateAsUpdate(document);
      }

      if (update.byteLength > 0) {
        client.emit('document:sync', { documentId, update });
      }

      this.trackDocumentMembership(client, documentId);

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
    @MessageBody() payload?: DocumentUpdatePayload,
  ): void {
    try {
      const documentId = this.ensureString(payload?.documentId);
      if (!documentId) {
        this.logger.warn(
          `Ignoring update without documentId from client ${client.id}`,
        );
        return;
      }

      const update = this.ensureUint8Array(payload?.update);
      if (!update) {
        this.logger.warn(
          `Ignoring malformed document update from ${client.id} for document ${documentId}`,
        );
        return;
      }

      const document = this.getOrCreateDocument(documentId);

      applyUpdate(document, update, client.id);
      client.broadcast
        .to(this.roomName(documentId))
        .emit('document:update', { documentId, update, actor: client.id });
    } catch (error) {
      this.logger.error(
        `Failed to handle document update from ${client.id}: ${error}`,
      );
    }
  }

  @SubscribeMessage('document:leave')
  handleDocumentLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload?: DocumentLeavePayload,
  ): void {
    const documentId = this.ensureString(payload?.documentId);
    if (!documentId) {
      return;
    }

    this.untrackDocumentMembership(client, documentId);
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

  private getOrCreateDocument(documentId: string): Doc {
    let document = this.documents.get(documentId);

    if (!document) {
      document = new Doc();
      this.documents.set(documentId, document);
    }

    return document;
  }

  private ensureUint8Array(input: unknown): Uint8Array | undefined {
    if (input instanceof Uint8Array) {
      return input;
    }
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }
    if (Array.isArray(input)) {
      return Uint8Array.from(input);
    }
    return undefined;
  }

  private roomName(documentId: string): string {
    return `document:${documentId}`;
  }

  private trackDocumentMembership(client: Socket, documentId: string): void {
    void client.join(this.roomName(documentId));

    const existingDocuments =
      this.clientDocuments.get(client.id) ?? new Set<string>();
    existingDocuments.add(documentId);
    this.clientDocuments.set(client.id, existingDocuments);

    const participants =
      this.documentParticipants.get(documentId) ?? new Set<string>();
    participants.add(client.id);
    this.documentParticipants.set(documentId, participants);
  }

  private untrackDocumentMembership(client: Socket, documentId: string): void {
    void client.leave(this.roomName(documentId));

    const existingDocuments = this.clientDocuments.get(client.id);
    if (existingDocuments) {
      existingDocuments.delete(documentId);
      if (existingDocuments.size === 0) {
        this.clientDocuments.delete(client.id);
      }
    }

    const participants = this.documentParticipants.get(documentId);
    if (participants) {
      participants.delete(client.id);
      if (participants.size === 0) {
        this.documentParticipants.delete(documentId);
      }
    }
  }
}
