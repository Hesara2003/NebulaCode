import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

import { RedisModule } from './redis/redis.module';
import { RunModule } from './run/run.module';
import { CollabModule } from './collab/collab.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              },
      },
    }),

    RedisModule,
    CollabModule,
    WorkspacesModule,
    AuthModule,
    WorkspaceModule,
    RunModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebsocketGateway],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
