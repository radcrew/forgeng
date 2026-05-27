import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import type { AppConfiguration } from '@config';

const DEV_USER_ID = 'dev-user-id';
const DEV_USER_EMAIL = 'dev-user-email';
const DEV_USER_ROLE = 'dev-user-role';

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
        'In development, authenticate via `x-user-id` or `x-user-email` headers (see README).',
    )
    .setVersion('1.0')
    .addServer('/api', 'API (global prefix)')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-user-id',
        in: 'header',
        description: 'Dev auth: seeded user id (e.g. 1)',
      },
      DEV_USER_ID,
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-user-email',
        in: 'header',
        description: 'Dev auth: user email (e.g. avery@example.com)',
      },
      DEV_USER_EMAIL,
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-user-role',
        in: 'header',
        description: 'Optional role hint: applicant | student | admin',
      },
      DEV_USER_ROLE,
    )
    .addSecurityRequirements(DEV_USER_ID)
    .addSecurityRequirements(DEV_USER_EMAIL)
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
