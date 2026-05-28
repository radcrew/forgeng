import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import type { AppConfiguration } from '@config';

/**
 * Express-level middleware applied once at bootstrap (security, compression,
 * cookie parsing for refresh-token rotation).
 * Route guards and Nest middleware modules stay in `core/` and feature modules.
 */
export function applyAppMiddleware(app: INestApplication): INestApplication {
  const config = app.get(ConfigService<AppConfiguration, true>);
  const isProduction =
    config.getOrThrow('nodeEnv', { infer: true }) === 'production';

  app.use(compression());
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginEmbedderPolicy: isProduction ? undefined : false,
    }),
  );

  return app;
}
