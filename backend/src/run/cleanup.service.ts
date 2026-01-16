import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { RunService } from './run.service';

/**
 * Cleanup worker that periodically checks for stale runs and times them out.
 * Also monitors runner service health.
 * Runs every 10 seconds and kills containers older than configured timeout (default 30s).
 */
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  private readonly staleThresholdMs: number;
  private readonly runnerUrl: string | undefined;
  private runnerHealthy = true;
  private lastHealthCheckTime: Date | null = null;

  constructor(
    private readonly runService: RunService,
    private readonly configService: ConfigService,
  ) {
    // Configurable via RUN_TIMEOUT_MS env var, defaults to 30 seconds
    this.staleThresholdMs =
      this.configService.get<number>('RUN_TIMEOUT_MS') ?? 30000;
    this.runnerUrl = this.configService.get<string>('RUNNER_API_URL');

    this.logger.log(
      `Cleanup worker initialized with stale threshold: ${this.staleThresholdMs}ms` +
      (this.runnerUrl ? `, runner URL: ${this.runnerUrl}` : ' (no runner configured)'),
    );
  }

  /**
   * Periodically check for and clean up stale runs.
   * This method is called every 10 seconds by the scheduler.
   */
  @Interval(10000)
  async handleCleanup(): Promise<void> {
    try {
      const staleRuns = await this.runService.getStaleRuns(
        this.staleThresholdMs,
      );

      for (const run of staleRuns) {
        try {
          this.logger.warn(
            `Timing out stale run ${run.runId} ` +
            `(started: ${run.startedAt}, workspace: ${run.workspaceId}, file: ${run.fileId})`,
          );
          await this.runService.timeoutRun(run.runId);
          this.logger.log(`Successfully timed out run ${run.runId}`);
        } catch (error) {
          const err = error as Error;
          this.logger.error(
            `Failed to timeout run ${run.runId}: ${err.message}`,
            err.stack,
          );
        }
      }

      if (staleRuns.length > 0) {
        this.logger.log(
          `Cleanup complete: timed out ${staleRuns.length} stale run(s).`,
        );
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cleanup worker error: ${err.message}`, err.stack);
    }
  }

  /**
   * Periodically check runner service health.
   * This method is called every 30 seconds.
   */
  @Interval(30000)
  async checkRunnerHealth(): Promise<void> {
    if (!this.runnerUrl) {
      // No runner configured, skip health check
      return;
    }

    try {
      const healthUrl = `${this.runnerUrl.replace(/\/$/, '')}/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        if (!this.runnerHealthy) {
          this.logger.log('Runner service recovered - now healthy');
        }
        this.runnerHealthy = true;
      } else {
        this.handleRunnerUnhealthy(`HTTP ${response.status}`);
      }
    } catch (error) {
      const err = error as Error;
      this.handleRunnerUnhealthy(err.message);
    }

    this.lastHealthCheckTime = new Date();
  }

  /**
   * Handle unhealthy runner state.
   */
  private handleRunnerUnhealthy(reason: string): void {
    if (this.runnerHealthy) {
      this.logger.error(
        `Runner service is unreachable: ${reason}. ` +
        'New runs may fail. Existing runs will be timed out by cleanup worker.',
      );
    }
    this.runnerHealthy = false;
  }

  /**
   * Get current runner health status.
   */
  isRunnerHealthy(): boolean {
    return this.runnerHealthy;
  }

  /**
   * Get last health check time.
   */
  getLastHealthCheckTime(): Date | null {
    return this.lastHealthCheckTime;
  }

  /**
   * Manually trigger cleanup (for testing or admin purposes).
   */
  async forceCleanup(): Promise<number> {
    this.logger.log('Force cleanup triggered');
    const staleRuns = await this.runService.getStaleRuns(this.staleThresholdMs);

    for (const run of staleRuns) {
      await this.runService.timeoutRun(run.runId);
    }

    this.logger.log(
      `Force cleanup completed: ${staleRuns.length} run(s) timed out`,
    );
    return staleRuns.length;
  }
}

