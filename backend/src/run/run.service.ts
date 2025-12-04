import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { CreateRunDto } from './dto/create-run.dto';
import { RunMetadata, RunStatus } from './run.types';
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

  constructor(
    private readonly redisService: RedisService,
    private readonly workspacesService: WorkspacesService,
    private readonly configService: ConfigService,
  ) {}

  async createRun(dto: CreateRunDto): Promise<RunMetadata> {
    const file = this.workspacesService.getFile(dto.workspaceId, dto.fileId);
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

    await this.notifyRunner(metadata, file);

    return metadata;
  }

  private buildKey(runId: string): string {
    return `${this.storePrefix}${runId}`;
  }

  private async notifyRunner(metadata: RunMetadata, file: WorkspaceFile): Promise<void> {
    const runnerUrl = this.configService.get<string>('RUNNER_API_URL');

    if (!runnerUrl) {
      this.logger.warn('RUNNER_API_URL is not configured. Run will remain queued until the runner is wired up.');
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
}
