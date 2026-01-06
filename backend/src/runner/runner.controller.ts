import { Controller, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RunnerService } from './runner.service';

@Controller('runner')
export class RunnerController {
  constructor(private readonly runnerService: RunnerService) {}

  @Post('spawn')
  async run() {
    const runId = randomUUID();
    await this.runnerService.spawn('nebula-runner:week2', runId);
    return { runId, status: 'running' };
  }
}
