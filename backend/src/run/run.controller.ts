import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { RunService } from './run.service';
import { CreateRunDto } from './dto/create-run.dto';

@Controller('run')
export class RunController {
  constructor(private readonly runService: RunService) { }

  /**
   * Create a new run. Strictly rate limited to prevent abuse.
   * Default: 10 runs per minute per IP.
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 runs per minute
  async createRun(@Body() dto: CreateRunDto) {
    const metadata = await this.runService.createRun(dto);
    return {
      runId: metadata.runId,
      status: metadata.status,
      workspaceId: metadata.workspaceId,
      fileId: metadata.fileId,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    };
  }

  /**
   * Get run status. No rate limiting for status checks.
   */
  @Get(':runId/status')
  @SkipThrottle()
  async getRunStatus(@Param('runId') runId: string) {
    return this.runService.getRunStatus(runId);
  }

  /**
   * Get run logs. No rate limiting for log retrieval.
   */
  @Get(':runId/logs')
  @SkipThrottle()
  async getRunLogs(@Param('runId') runId: string) {
    return this.runService.getRunLogs(runId);
  }

  /**
   * Cancel a run. Moderate rate limiting.
   */
  @Post(':runId/cancel')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 cancels per minute
  async cancelRun(@Param('runId') runId: string) {
    return this.runService.cancelRun(runId);
  }

  /**
   * Timeout a run (internal/admin use).
   */
  @Post(':runId/timeout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle() // Internal endpoint
  async timeoutRun(@Param('runId') runId: string) {
    return this.runService.timeoutRun(runId);
  }
}
