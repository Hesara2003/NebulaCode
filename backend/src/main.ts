import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { Logger as NestLogger } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });

  const logger = app.get(PinoLogger);
  app.useLogger(logger);

  // Ensure all WebSocket gateways share the Socket.IO adapter instead of the default ws adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  app.enableCors({ origin: true, credentials: true });

  const httpInstance = app.getHttpAdapter().getInstance();
  if (httpInstance?.set) {
    httpInstance.set('etag', false);
  }
  if (httpInstance?.disable) {
    httpInstance.disable('x-powered-by');
  }
  if (httpInstance?.use) {
    httpInstance.use((_: Request, res: Response, next: NextFunction) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      next();
    });
  }

  const configService = app.get(ConfigService);
  const port =
    configService.get<number>('PORT') ?? Number(process.env.PORT ?? 4001);

  logger.log(`Attempting to listen on 0.0.0.0:${port}`);
  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  const bootstrapLogger = new NestLogger('Bootstrap');
  bootstrapLogger.error('Failed to bootstrap Nest application', error);
  process.exit(1);
});
