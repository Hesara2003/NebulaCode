import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsAuthGuard } from '../auth/ws-auth.guard';
import { RunsService } from './runs.service';

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  path: '/runs',
  cors: { origin: true },
  transports: ['websocket'],
})
export class RunsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RunsGateway.name);

  constructor(private readonly runsService: RunsService) {}

  handleConnection(client: Socket) {
    const runId = this.extractRunId(client);
    if (!runId) {
      client.emit('error', 'missing-run-id');
      client.disconnect();
      this.logger.warn(`Rejected client ${client.id} due to missing runId`);
      return;
    }
    this.runsService.registerClient(runId, client);
  }

  handleDisconnect(client: Socket) {
    this.runsService.unregisterClient(client);
  }

  private extractRunId(client: Socket): string | undefined {
    const queryRunId = client.handshake?.query?.runId;
    if (typeof queryRunId === 'string') {
      return queryRunId;
    }

    return undefined;
  }
}

