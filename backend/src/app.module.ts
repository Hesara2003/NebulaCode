import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [WorkspaceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
