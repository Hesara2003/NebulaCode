import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { RunService } from './run.service';
import { RunStatus } from './run.types';

/**
 * Cleanup worker that periodically checks for stale runs and times them out.
 * Runs every 10 seconds and kills containers older than 30 seconds.
 */
@Injectable()
export class CleanupService {
    private readonly logger = new Logger(CleanupService.name);
    private readonly STALE_THRESHOLD_MS = 30000; // 30 seconds

    constructor(private readonly runService: RunService) { }

    /**
     * Periodically check for and clean up stale runs.
     * This method is called every 10 seconds by the scheduler.
     */
    @Interval(10000)
    async handleCleanup(): Promise<void> {
        try {
            const staleRuns = await this.runService.getStaleRuns(this.STALE_THRESHOLD_MS);

            for (const run of staleRuns) {
                this.logger.warn(`Timing out stale run ${run.runId} (started at ${run.startedAt})`);
                await this.runService.timeoutRun(run.runId);
            }

            if (staleRuns.length > 0) {
                this.logger.log(`Cleaned up ${staleRuns.length} stale run(s).`);
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
        const staleRuns = await this.runService.getStaleRuns(this.STALE_THRESHOLD_MS);

        for (const run of staleRuns) {
            await this.runService.timeoutRun(run.runId);
        }

        return staleRuns.length;
    }
}
