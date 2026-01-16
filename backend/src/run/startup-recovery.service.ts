import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { RunMetadata, RunStatus } from './run.types';
import { RunsService } from '../runs/runs.service';

/**
 * Startup recovery service that cleans up stale runs from previous backend sessions.
 * 
 * On backend restart:
 * - Marks any 'queued' or 'running' runs as 'failed' with reason "Backend restart"
 * - Clears orphaned container tracking entries
 * - Logs recovery actions for debugging
 * 
 * This ensures the system state is consistent even after unexpected crashes.
 */
@Injectable()
export class StartupRecoveryService implements OnModuleInit {
    private readonly logger = new Logger(StartupRecoveryService.name);
    private readonly storePrefix = 'run:';
    private readonly ACTIVE_RUNS_KEY = 'run:active-set';
    private readonly CONTAINER_SET_KEY = 'run:containers';

    constructor(
        private readonly redisService: RedisService,
        private readonly runsService: RunsService,
    ) { }

    async onModuleInit(): Promise<void> {
        this.logger.log('Starting run state recovery...');

        try {
            const recoveredCount = await this.recoverStaleRuns();
            const containersCleared = await this.clearOrphanedContainers();

            if (recoveredCount > 0 || containersCleared > 0) {
                this.logger.warn(
                    `Recovery complete: ${recoveredCount} stale run(s) marked as failed, ` +
                    `${containersCleared} orphaned container(s) cleared`,
                );
            } else {
                this.logger.log('Recovery complete: No stale runs or orphaned containers found');
            }
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Recovery failed: ${err.message}`, err.stack);
            // Don't throw - allow backend to start even if recovery fails
        }
    }

    /**
     * Find and mark all stale runs (queued/running) as failed.
     */
    private async recoverStaleRuns(): Promise<number> {
        const activeRunIds = await this.redisService.getSetMembers(
            this.ACTIVE_RUNS_KEY,
        );

        if (activeRunIds.length === 0) {
            return 0;
        }

        let recoveredCount = 0;

        for (const runId of activeRunIds) {
            try {
                const metadata = await this.redisService.getJson<RunMetadata>(
                    `${this.storePrefix}${runId}`,
                );

                if (!metadata) {
                    // Orphaned entry in active set - remove it
                    this.logger.warn(`Removing orphaned run ID from active set: ${runId}`);
                    await this.redisService.removeFromSet(this.ACTIVE_RUNS_KEY, runId);
                    continue;
                }

                // Only recover runs that are in non-terminal states
                if (
                    metadata.status === RunStatus.Queued ||
                    metadata.status === RunStatus.Running
                ) {
                    this.logger.warn(
                        `Recovering stale run ${runId} (was: ${metadata.status}) - marking as failed`,
                    );

                    // Update run status
                    metadata.status = RunStatus.Failed;
                    metadata.updatedAt = new Date().toISOString();
                    await this.redisService.setJson(
                        `${this.storePrefix}${runId}`,
                        metadata,
                    );

                    // Remove from active set
                    await this.redisService.removeFromSet(this.ACTIVE_RUNS_KEY, runId);

                    // Remove container from tracking if exists
                    if (metadata.containerId) {
                        await this.redisService.removeFromSet(
                            this.CONTAINER_SET_KEY,
                            metadata.containerId,
                        );
                    }

                    // Notify connected clients about the failure
                    try {
                        this.runsService.sendStatus(
                            runId,
                            'failed',
                            'Backend restarted - run was interrupted',
                        );
                    } catch {
                        // Client may not be connected anymore
                    }

                    recoveredCount++;
                }
            } catch (error) {
                const err = error as Error;
                this.logger.error(
                    `Failed to recover run ${runId}: ${err.message}`,
                    err.stack,
                );
            }
        }

        return recoveredCount;
    }

    /**
     * Clear container tracking set on startup.
     * Containers from previous session are likely gone or orphaned.
     */
    private async clearOrphanedContainers(): Promise<number> {
        const containerIds = await this.redisService.getSetMembers(
            this.CONTAINER_SET_KEY,
        );

        if (containerIds.length === 0) {
            return 0;
        }

        // Log the orphaned containers for manual investigation if needed
        this.logger.warn(
            `Found ${containerIds.length} orphaned container(s) from previous session: ${containerIds.join(', ')}`,
        );

        // Clear all container tracking
        for (const containerId of containerIds) {
            await this.redisService.removeFromSet(this.CONTAINER_SET_KEY, containerId);
        }

        return containerIds.length;
    }
}
