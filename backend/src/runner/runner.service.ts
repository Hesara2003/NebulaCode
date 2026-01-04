import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../common/redis/redis.service';
import { FilesService } from '../files/files.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RunnerService {
    constructor(
        private readonly redisService: RedisService,
        private readonly filesService: FilesService,
    ) { }

    async createRun(workspaceId: string): Promise<{ runId: string; status: string }> {
        const runId = uuidv4();
        const runData = {
            runId,
            workspaceId,
            status: 'running',
            startTime: Date.now(),
        };

        // Cache run metadata in Redis
        await this.redisService.getClient().hset(`run:${runId}`, runData);
        // Add to active runs set for easy scanning
        await this.redisService.getClient().sadd('active_runs', runId);

        return { runId, status: 'running' };
    }

    async finishRun(runId: string, logContent: string): Promise<void> {
        const exists = await this.redisService.getClient().exists(`run:${runId}`);
        if (!exists) {
            throw new NotFoundException(`Run ${runId} not found`);
        }

        // Upload logs via FileService (S3 Stub)
        await this.filesService.saveLog(runId, logContent);

        // Update status
        await this.redisService.getClient().hset(`run:${runId}`, {
            status: 'completed',
            endTime: Date.now(),
        });
        await this.redisService.getClient().srem('active_runs', runId);
    }

    async getLogs(runId: string): Promise<string> {
        return await this.filesService.getLog(runId);
    }
}
