import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
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

	const port = Number(process.env.PORT ?? 4000);
	await app.listen(port);
	console.log(`🚀 Backend running on http://localhost:${port}`);
}

void bootstrap();
