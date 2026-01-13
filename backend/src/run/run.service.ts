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
  private readonly ACTIVE_RUNS_KEY = 'run:active-set';

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
    await this.redisService.addToSet(this.ACTIVE_RUNS_KEY, runId);
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
    const previousStatus = metadata.status;
    metadata.status = status;
    metadata.updatedAt = new Date().toISOString();

    // Set startedAt when transitioning to Running
    if (status === RunStatus.Running && !metadata.startedAt) {
      metadata.startedAt = metadata.updatedAt;
    }

    await this.redisService.setJson(this.buildKey(runId), metadata);

    // Remove from active set when reaching terminal state
    if (this.isTerminalStatus(status) && !this.isTerminalStatus(previousStatus)) {
      await this.redisService.removeFromSet(this.ACTIVE_RUNS_KEY, runId);
      this.logger.debug(`Run ${runId} removed from active set (status: ${status})`);
    }

    return metadata;
  }

  async cancelRun(runId: string): Promise<RunMetadata> {
    const metadata = await this.getRunMetadata(runId);
    if (this.isTerminalStatus(metadata.status)) {
      throw new ConflictException(`Run ${runId} is already in terminal state: ${metadata.status}`);
    }

    // Signal runner to stop the container
    await this.signalRunnerToStop(runId);

    return this.updateRunStatus(runId, RunStatus.Cancelled);
  }

  async timeoutRun(runId: string): Promise<RunMetadata> {
    const metadata = await this.getRunMetadata(runId);
    if (this.isTerminalStatus(metadata.status)) {
      throw new ConflictException(`Run ${runId} is already in terminal state: ${metadata.status}`);
    }
    return this.updateRunStatus(runId, RunStatus.TimedOut);
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
      status === RunStatus.Cancelled ||
      status === RunStatus.TimedOut
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

  /**
   * Signal the runner to stop a container for a given run.
   * If RUNNER_API_URL is not configured, this is a no-op (simulated mode).
   */
  private async signalRunnerToStop(runId: string): Promise<void> {
    const runnerUrl = this.configService.get<string>('RUNNER_API_URL');

    if (!runnerUrl) {
      this.logger.log(`[Simulated] Would signal runner to stop container for run ${runId}`);
      return;
    }

    try {
      const response = await fetch(`${runnerUrl.replace(/\/$/, '')}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        this.logger.warn(`Runner stop API responded with status ${response.status} for run ${runId}`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to signal runner to stop: ${err.message}`, err.stack);
      // Don't throw - proceed with status update even if runner signal fails
    }
  }

  /**
   * Get all runs that are in 'running' status and have exceeded the timeout threshold.
   * @param thresholdMs - Maximum allowed running time in milliseconds
   */
  async getStaleRuns(thresholdMs: number): Promise<RunMetadata[]> {
    const now = Date.now();
    const staleRuns: RunMetadata[] = [];
    const activeRunIds = await this.getActiveRunIds();

    for (const runId of activeRunIds) {
      try {
        const metadata = await this.redisService.getJson<RunMetadata>(this.buildKey(runId));
        if (!metadata) {
          // Run metadata missing but still in active set - clean up the orphan
          this.logger.warn(`Orphaned run ID ${runId} found in active set (no metadata). Removing.`);
          await this.redisService.removeFromSet(this.ACTIVE_RUNS_KEY, runId);
          continue;
        }

        // Only consider runs that are in Running state
        if (metadata.status !== RunStatus.Running) {
          continue;
        }

        // Check if startedAt exists and exceeds threshold
        if (metadata.startedAt) {
          const startedAtMs = new Date(metadata.startedAt).getTime();
          const runningDuration = now - startedAtMs;
          if (runningDuration > thresholdMs) {
            this.logger.debug(`Run ${runId} is stale (running for ${runningDuration}ms)`);
            staleRuns.push(metadata);
          }
        }
      } catch (error) {
        const err = error as Error;
        this.logger.error(`Error checking run ${runId} for staleness: ${err.message}`);
      }
    }

    this.logger.debug(`Found ${staleRuns.length} stale run(s) out of ${activeRunIds.length} active runs`);
    return staleRuns;
  }

  /**
   * Get all run IDs currently being tracked (for cleanup worker).
   */
  async getActiveRunIds(): Promise<string[]> {
    return this.redisService.getSetMembers(this.ACTIVE_RUNS_KEY);
  }
}
