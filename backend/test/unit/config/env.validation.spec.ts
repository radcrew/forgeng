import 'reflect-metadata';
import { validateEnv } from '../../../src/config/env.validation';

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  SMTP_HOST: 'smtp.example.com',
};

describe('validateEnv', () => {
  it('accepts a complete production setup', () => {
    expect(() => validateEnv(production)).not.toThrow();
  });

  it('refuses production without SMTP_HOST', () => {
    // Otherwise every email is only logged and nothing warns about it.
    expect(() => validateEnv({ ...production, SMTP_HOST: undefined })).toThrow(
      'Production requires the following env vars: SMTP_HOST',
    );
  });

  it('lets development run without SMTP', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      }),
    ).not.toThrow();
  });
});
