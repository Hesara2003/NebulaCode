import { Injectable, Logger } from '@nestjs/common';
import type { Socket } from 'socket.io';
import type { RunStatus, RunStreamEvent } from './runs.types';

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);
  private readonly runClients = new Map<string, Set<Socket>>();
  private readonly clientRunIndex = new Map<string, string>();

  registerClient(runId: string, client: Socket) {
    const clients = this.runClients.get(runId) ?? new Set<Socket>();
    clients.add(client);
    this.runClients.set(runId, clients);
    this.clientRunIndex.set(client.id, runId);
    this.logger.debug(`Client ${client.id} joined run ${runId}`);
  }

  unregisterClient(client: Socket) {
    const runId = this.clientRunIndex.get(client.id);
    if (!runId) return;

    const clients = this.runClients.get(runId);
    clients?.delete(client);
    if (clients && clients.size === 0) {
      this.runClients.delete(runId);
    }
    this.clientRunIndex.delete(client.id);
    this.logger.debug(`Client ${client.id} left run ${runId}`);
  }

  sendStdout(runId: string, data: string) {
    this.broadcast(runId, {
      type: 'stdout',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  sendStderr(runId: string, data: string) {
    this.broadcast(runId, {
      type: 'stderr',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  sendStatus(runId: string, status: RunStatus, reason?: string) {
    this.broadcast(runId, {
      type: 'status',
      data: status,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  private broadcast(runId: string, payload: RunStreamEvent) {
    const clients = this.runClients.get(runId);
    if (!clients) return;
    clients.forEach((client) => client.emit('run-event', payload));
  }
}
