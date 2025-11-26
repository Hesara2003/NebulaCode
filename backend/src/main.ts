import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { Logger as NestLogger } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  const logger = app.get(PinoLogger);
  app.useLogger(logger);

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
  const port = configService.get<number>('PORT') ?? Number(process.env.PORT ?? 4000);

  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  const bootstrapLogger = new NestLogger('Bootstrap');
  bootstrapLogger.error('Failed to bootstrap Nest application', error);
  process.exit(1);
});