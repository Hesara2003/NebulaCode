import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { RunsService } from './runs.service';
import { StreamOutputDto } from './dto/stream-output.dto';

@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Post(':runId/cancel')
  cancelRun(@Param('runId') runId: string) {
    this.runsService.sendStatus(runId, 'cancelled', 'Cancelled by user');
    return { runId, status: 'cancelled' as const };
  }

  @Post(':runId/stdout')
  @HttpCode(HttpStatus.ACCEPTED)
  streamStdout(
    @Param('runId') runId: string,
    @Body() dto: StreamOutputDto,
  ): { runId: string; accepted: boolean } {
    this.runsService.sendStdout(runId, dto.data);
    return { runId, accepted: true };
  }

  @Post(':runId/stderr')
  @HttpCode(HttpStatus.ACCEPTED)
  streamStderr(
    @Param('runId') runId: string,
    @Body() dto: StreamOutputDto,
  ): { runId: string; accepted: boolean } {
    this.runsService.sendStderr(runId, dto.data);
    return { runId, accepted: true };
  }
}
