import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsOptional()
  @IsEnum(NodeEnvironment)
  NODE_ENV?: NodeEnvironment;

  @IsOptional()
  @IsString()
  JWT_ACCESS_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TTL?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_TTL?: string;

  @IsOptional()
  @IsString()
  REFRESH_COOKIE_NAME?: string;

  @IsOptional()
  @IsString()
  REFRESH_COOKIE_DOMAIN?: string;

  @IsOptional()
  @IsInt()
  EMAIL_VERIFY_TTL_MINUTES?: number;

  @IsOptional()
  @IsInt()
  PASSWORD_RESET_TTL_MINUTES?: number;

  @IsOptional()
  @IsString()
  OAUTH_SUCCESS_REDIRECT?: string;

  @IsOptional()
  @IsString()
  OAUTH_FAILURE_REDIRECT?: string;

  @IsOptional()
  @IsString()
  EMAIL_VERIFY_REDIRECT?: string;

  @IsOptional()
  @IsString()
  PASSWORD_RESET_REDIRECT?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CALLBACK_URL?: string;

  @IsOptional()
  @IsString()
  GITHUB_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GITHUB_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GITHUB_CALLBACK_URL?: string;

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  SMTP_PORT?: number;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsOptional()
  @IsString()
  SMTP_SECURE?: string;

  @IsOptional()
  @IsString()
  EMAIL_FROM?: string;
}

/** Validates `process.env` at startup; fails fast on missing required vars. */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const message = errors
      .map((err) => Object.values(err.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${message}`);
  }

  if (validated.NODE_ENV === NodeEnvironment.Production) {
    const missing: string[] = [];
    if (!validated.JWT_ACCESS_SECRET) missing.push('JWT_ACCESS_SECRET');
    if (!validated.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
    if (missing.length > 0) {
      throw new Error(
        `Production requires the following env vars: ${missing.join(', ')}`,
      );
    }
  }

  return config;
}
