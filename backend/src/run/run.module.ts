import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RunController } from './run.controller';
import { RunService } from './run.service';
import { CleanupService } from './cleanup.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { RunsModule } from '../runs/runs.module';

@Module({
  imports: [WorkspacesModule, RunsModule, ScheduleModule.forRoot()],
  controllers: [RunController],
  providers: [RunService, CleanupService],
  exports: [RunService],
})
export class RunModule {}
