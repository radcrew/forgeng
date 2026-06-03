import 'tsconfig-paths/register';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import type { Response } from 'express';

import { AppModule } from './app.module';
import { applyAppMiddleware } from './app.middleware';
import { setupSwagger } from './swagger';
import { PrismaExceptionFilter } from '@common/filters/prisma-exception.filter';
import type { AppConfiguration } from '@config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  applyAppMiddleware(app);

  const config = app.get(ConfigService<AppConfiguration, true>);
  const port = config.getOrThrow('port', { infer: true });
  const corsOrigin = config.getOrThrow('corsOrigin', { infer: true });
  const uploadsDir = config.getOrThrow('uploadsDir', { infer: true });

  app.setGlobalPrefix('api');

  // Serve uploaded files (avatars, etc.). The global `/api` prefix only applies
  // to controller routes, so the static prefix must include it explicitly.
  // Override helmet's default `Cross-Origin-Resource-Policy: same-origin` so the
  // frontend (a different origin in dev) can embed these public images.
  app.useStaticAssets(uploadsDir, {
    prefix: '/api/uploads',
    setHeaders: (res: Response) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  setupSwagger(app);

  await app.listen(port);
  console.log(`🚀 forgeng API running on http://localhost:${port}/api`);
  if (config.getOrThrow('nodeEnv', { infer: true }) !== 'production') {
    console.log(`📖 OpenAPI docs at http://localhost:${port}/api/docs`);
  }
}
void bootstrap();
