import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../common/redis/redis.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class CleanupWorker {
    private readonly logger = new Logger(CleanupWorker.name);
    private readonly RUN_TIMEOUT_MS = 60 * 1000; // 1 minute timeout for demo

    constructor(
        private readonly redisService: RedisService,
        private readonly filesService: FilesService,
    ) { }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleCron() {
        this.logger.debug('Checking for stale runs...');
        const activeRuns = await this.redisService.getClient().smembers('active_runs');

        for (const runId of activeRuns) {
            const runData = await this.redisService.getClient().hgetall(`run:${runId}`);

            if (!runData || !runData.startTime) {
                // Corrupt data, remove
                await this.redisService.getClient().srem('active_runs', runId);
                continue;
            }

            const startTime = parseInt(runData.startTime);
            const now = Date.now();

            if (now - startTime > this.RUN_TIMEOUT_MS) {
                this.logger.warn(`Run ${runId} timed out. Terminating...`);
                await this.terminateRun(runId);
            }
        }
    }

    private async terminateRun(runId: string) {
        // In a real scenario, this would kill the container/process.
        // Here we just mark it as failed and save a log.

        const terminationLog = `[System] Run terminated by Cleanup Worker due to timeout.\n`;
        await this.filesService.saveLog(runId, terminationLog);

        await this.redisService.getClient().hset(`run:${runId}`, {
            status: 'terminated',
            endTime: Date.now(),
        });
        await this.redisService.getClient().srem('active_runs', runId);
        this.logger.log(`Run ${runId} terminated successfully.`);
    }
}
