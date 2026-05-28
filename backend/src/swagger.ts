import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import type { AppConfiguration } from '@config';

const BEARER_AUTH = 'bearer';

export function setupSwagger(app: INestApplication): void {
  const config = app.get(ConfigService<AppConfiguration, true>);
  const nodeEnv = config.getOrThrow('nodeEnv', { infer: true });

  if (nodeEnv === 'production') {
    return;
  }

  const documentConfig = new DocumentBuilder()
    .setTitle('Forgeng API')
    .setDescription(
      'Cohort-based apprenticeship platform REST API. ' +
        'Authenticate via POST /auth/login to obtain a JWT access token, ' +
        'then send it as `Authorization: Bearer <token>`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token from POST /auth/login',
      },
      BEARER_AUTH,
    )
    .addSecurityRequirements(BEARER_AUTH)
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
    },
    useGlobalPrefix: true,
  });
}
