import { Module } from '@nestjs/common';
import { RunController } from './run.controller';
import { RunService } from './run.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';

import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [WorkspacesModule, ConfigModule, RedisModule],
  controllers: [RunController],
  providers: [RunService],
  exports: [RunService],
})
export class RunModule { }
