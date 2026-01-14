import { Module } from '@nestjs/common';
import { RunsGateway } from './runs.gateway';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';

@Module({
  providers: [RunsGateway, RunsService],
  controllers: [RunsController],
  exports: [RunsService],
})
export class RunsModule {}
