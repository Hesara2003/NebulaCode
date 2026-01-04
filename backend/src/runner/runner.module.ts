import { Module } from '@nestjs/common';
import { RunnerService } from './runner.service';
import { RunnerController } from './runner.controller';
import { CleanupWorker } from './cleanup.worker';
import { FilesModule } from '../files/files.module';
import { RedisService } from '../common/redis/redis.service';

@Module({
    imports: [FilesModule],
    controllers: [RunnerController],
    providers: [RunnerService, CleanupWorker, RedisService],
})
export class RunnerModule { }
