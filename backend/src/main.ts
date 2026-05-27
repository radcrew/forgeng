import 'tsconfig-paths/register';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { applyAppMiddleware } from './app.middleware';
import { PrismaExceptionFilter } from '@common/filters/prisma-exception.filter';
import type { AppConfiguration } from '@config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  applyAppMiddleware(app);

  const config = app.get(ConfigService<AppConfiguration, true>);
  const port = config.getOrThrow('port', { infer: true });
  const corsOrigin = config.getOrThrow('corsOrigin', { infer: true });

  app.setGlobalPrefix('api');

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

  await app.listen(port);
  console.log(`🚀 forgeng API running on http://localhost:${port}/api`);
}
void bootstrap();
