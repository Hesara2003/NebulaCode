import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RunnerService } from './runner.service';

@Controller('run')
export class RunnerController {
    constructor(private readonly runnerService: RunnerService) { }

    @Post()
    async createRun(@Body('workspaceId') workspaceId: string) {
        return await this.runnerService.createRun(workspaceId);
    }

    @Post(':runId/finish')
    async finishRun(
        @Param('runId') runId: string,
        @Body('logContent') logContent: string,
    ) {
        await this.runnerService.finishRun(runId, logContent);
        return { success: true };
    }

    @Get(':runId/logs')
    async getLogs(@Param('runId') runId: string) {
        return await this.runnerService.getLogs(runId);
    }
}
