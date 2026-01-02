import { Controller, Param, Post } from '@nestjs/common';
import { RunsService } from './runs.service';

@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Post(':runId/cancel')
  cancelRun(@Param('runId') runId: string) {
    this.runsService.sendStatus(runId, 'cancelled', 'Cancelled by user');
    return { runId, status: 'cancelled' as const };
  }
}

