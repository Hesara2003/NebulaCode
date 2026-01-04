import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { CreateRunDto } from './dto/create-run.dto';
import { RunLogsPayload, RunMetadata, RunStatus } from './run.types';
import { WorkspacesService } from '../workspaces/workspaces.service';
import type { WorkspaceFile } from '../workspaces/workspaces.service';

interface RunnerRequestPayload {
  runId: string;
  workspaceId: string;
  fileId: string;
  language: string;
  path: string;
  content: string;
}

@Injectable()
export class RunService {
  private readonly logger = new Logger(RunService.name);
  private readonly storePrefix = 'run:';
  private readonly logStorePrefix = 'run-logs:';

  constructor(
    private readonly redisService: RedisService,
    private readonly workspacesService: WorkspacesService,
    private readonly configService: ConfigService,
  ) { }

  async createRun(dto: CreateRunDto): Promise<RunMetadata> {
    const file = await this.workspacesService.getFile(dto.workspaceId, dto.fileId);
    const runId = randomUUID();
    const now = new Date().toISOString();

    const metadata: RunMetadata = {
      runId,
      workspaceId: dto.workspaceId,
      fileId: dto.fileId,
      language: dto.language ?? file.language,
      status: RunStatus.Queued,
      createdAt: now,
      updatedAt: now,
    };

    await this.redisService.setJson(this.buildKey(runId), metadata);
    await this.initialiseRunLogs(metadata, file);

    await this.notifyRunner(metadata, file);

    return metadata;
  }

  private buildKey(runId: string): string {
    return `${this.storePrefix}${runId}`;
  }

  private buildLogKey(runId: string): string {
    return `${this.logStorePrefix}${runId}`;
  }

  async getRunStatus(runId: string): Promise<RunMetadata> {
    return this.getRunMetadata(runId);
  }

  async updateRunStatus(runId: string, status: RunStatus): Promise<RunMetadata> {
    const metadata = await this.getRunMetadata(runId);
    metadata.status = status;
    metadata.updatedAt = new Date().toISOString();
    await this.redisService.setJson(this.buildKey(runId), metadata);
    return metadata;
  }

  async appendRunLogs(runId: string, lines: string | string[]): Promise<void> {
    const logKey = this.buildLogKey(runId);
    const payload = await this.redisService.getJson<RunLogsPayload>(logKey);
    const now = new Date().toISOString();
    const nextSection = Array.isArray(lines) ? lines.join('\n') : lines;
    const content = payload?.content ? `${payload.content}\n${nextSection}` : nextSection;

    const nextPayload: RunLogsPayload = {
      runId,
      filename: payload?.filename ?? `run-${runId}.log`,
      content,
      updatedAt: now,
    };

    await this.redisService.setJson(logKey, nextPayload);
  }

  async getRunLogs(runId: string): Promise<RunLogsPayload> {
    const metadata = await this.getRunMetadata(runId);
    if (!this.isTerminalStatus(metadata.status)) {
      throw new ConflictException('Run is still in progress. Logs are not ready yet.');
    }

    const payload = await this.redisService.getJson<RunLogsPayload>(
      this.buildLogKey(runId),
    );

    if (!payload) {
      throw new NotFoundException(`Logs for run ${runId} were not found.`);
    }

    return payload;
  }

  private async getRunMetadata(runId: string): Promise<RunMetadata> {
    const metadata = await this.redisService.getJson<RunMetadata>(
      this.buildKey(runId),
    );

    if (!metadata) {
      throw new NotFoundException(`Run ${runId} was not found.`);
    }

    return metadata;
  }

  private async initialiseRunLogs(
    metadata: RunMetadata,
    file: WorkspaceFile,
  ): Promise<void> {
    const now = new Date().toISOString();
    const entry: RunLogsPayload = {
      runId: metadata.runId,
      filename: `run-${metadata.runId}.log`,
      content: `[${now}] Run queued for ${file.path}`,
      updatedAt: now,
    };

    await this.redisService.setJson(this.buildLogKey(metadata.runId), entry);
  }

  private isTerminalStatus(status: RunStatus): boolean {
    return (
      status === RunStatus.Completed ||
      status === RunStatus.Failed ||
      status === RunStatus.Cancelled
    );
  }

  private async notifyRunner(metadata: RunMetadata, file: WorkspaceFile): Promise<void> {
    const runnerUrl = this.configService.get<string>('RUNNER_API_URL');

    if (!runnerUrl) {
      this.logger.warn(
        'RUNNER_API_URL is not configured. Simulating run lifecycle locally.',
      );
      this.simulateRunLifecycle(metadata, file);
      return;
    }

    const payload: RunnerRequestPayload = {
      runId: metadata.runId,
      workspaceId: metadata.workspaceId,
      fileId: metadata.fileId,
      language: metadata.language,
      path: file.path,
      content: file.content,
    };

    try {
      const response = await fetch(`${runnerUrl.replace(/\/$/, '')}/spawn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Runner API responded with status ${response.status}`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to call Runner API: ${err.message}`, err.stack);
      throw new ServiceUnavailableException('Runner service is unavailable. Please try again later.');
    }
  }

  private simulateRunLifecycle(metadata: RunMetadata, file: WorkspaceFile): void {
    this.logger.log(`Simulating run lifecycle for ${metadata.runId} (${file.path}).`);

    setTimeout(() => {
      void this.appendRunLogs(
        metadata.runId,
        `[${new Date().toISOString()}] Runner picked up the job.`,
      );
      void this.updateRunStatus(metadata.runId, RunStatus.Running);
    }, 1000);

    setTimeout(() => {
      void this.appendRunLogs(metadata.runId, [
        `[${new Date().toISOString()}] Executing ${file.path} (${metadata.language}).`,
        `[${new Date().toISOString()}] Execution finished successfully.`,
      ]);
      void this.updateRunStatus(metadata.runId, RunStatus.Completed);
    }, 3250);
  }
}
