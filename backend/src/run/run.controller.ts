import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { RunService } from './run.service';
import { CreateRunDto } from './dto/create-run.dto';
 

@Controller('run')
export class RunController {
  constructor(private readonly runService: RunService) { }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
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




  @Get(':runId/status')
  async getRunStatus(@Param('runId') runId: string) {
    return this.runService.getRunStatus(runId);
  }

  @Get(':runId/logs')
  async getRunLogs(@Param('runId') runId: string) {
    return this.runService.getRunLogs(runId);
  }

  @Post(':runId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelRun(@Param('runId') runId: string) {
    return this.runService.cancelRun(runId);
  }

  @Post(':runId/timeout')
  @HttpCode(HttpStatus.OK)
  async timeoutRun(@Param('runId') runId: string) {
    return this.runService.timeoutRun(runId);
  }
}
