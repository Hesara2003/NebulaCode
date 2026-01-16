import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

import { RedisModule } from './redis/redis.module';
import { RunModule } from './run/run.module';
import { RunsModule } from './runs/runs.module';
import { CollabModule } from './collab/collab.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: default 60 requests per minute per IP
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL_MS') ?? 60000, // 1 minute
            limit: config.get<number>('THROTTLE_LIMIT') ?? 60, // 60 requests
          },
        ],
      }),
    }),

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
    RunModule,
    RunsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    WebsocketGateway,
    // Global throttler guard - applies to all routes by default
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
