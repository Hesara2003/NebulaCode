import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { RunService } from './run.service';
import { RunStatus } from './run.types';

/**
 * Cleanup worker that periodically checks for stale runs and times them out.
 * Runs every 10 seconds and kills containers older than configured timeout (default 30s).
 */
@Injectable()
export class CleanupService {
    private readonly logger = new Logger(CleanupService.name);
    private readonly staleThresholdMs: number;

    constructor(
        private readonly runService: RunService,
        private readonly configService: ConfigService,
    ) {
        // Configurable via RUN_TIMEOUT_MS env var, defaults to 30 seconds
        this.staleThresholdMs = this.configService.get<number>('RUN_TIMEOUT_MS') ?? 30000;
        this.logger.log(`Cleanup worker initialized with stale threshold: ${this.staleThresholdMs}ms`);
    }

    /**
     * Periodically check for and clean up stale runs.
     * This method is called every 10 seconds by the scheduler.
     */
    @Interval(10000)
    async handleCleanup(): Promise<void> {
        try {
            const staleRuns = await this.runService.getStaleRuns(this.staleThresholdMs);

            for (const run of staleRuns) {
                try {
                    this.logger.warn(
                        `Timing out stale run ${run.runId} ` +
                        `(started: ${run.startedAt}, workspace: ${run.workspaceId}, file: ${run.fileId})`
                    );
                    await this.runService.timeoutRun(run.runId);
                    this.logger.log(`Successfully timed out run ${run.runId}`);
                } catch (error) {
                    const err = error as Error;
                    this.logger.error(`Failed to timeout run ${run.runId}: ${err.message}`, err.stack);
                }
            }

            if (staleRuns.length > 0) {
                this.logger.log(`Cleanup complete: timed out ${staleRuns.length} stale run(s).`);
            }
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Cleanup worker error: ${err.message}`, err.stack);
        }
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

        this.logger.log(`Force cleanup completed: ${staleRuns.length} run(s) timed out`);
        return staleRuns.length;
    }
}

