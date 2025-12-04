import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RunService } from './run.service';
import { CreateRunDto } from './dto/create-run.dto';

@Controller('run')
export class RunController {
  constructor(private readonly runService: RunService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createRun(@Body() dto: CreateRunDto) {
    const metadata = await this.runService.createRun(dto);
    return {
      runId: metadata.runId,
      status: metadata.status,
    };
  }
}
