import { join } from 'node:path';

import type {
  AppConfiguration,
  OAuthProviderConfig,
  SmtpConfig,
} from './config.types';

const DEFAULT_PORT = 3001;
const DEFAULT_CORS = 'http://localhost:3000';
const DEFAULT_FRONTEND = 'http://localhost:3000';
const DEFAULT_ACCESS_TTL = '15m';
const DEFAULT_REFRESH_TTL = '7d';
const DEFAULT_REFRESH_COOKIE = 'forgeng_refresh';
const DEFAULT_ACCESS_COOKIE = 'forgeng_access';
const DEFAULT_VERIFY_TTL_MINUTES = 60 * 24; // 24h
const DEFAULT_PASSWORD_RESET_TTL_MINUTES = 60; // 1h — reset links are short-lived
const DEFAULT_EMAIL_FROM = 'no-reply@forgeng.local';

function parsePort(raw: string | undefined, fallback: number): number {
  const port = Number.parseInt(raw ?? String(fallback), 10);
  return Number.isFinite(port) ? port : fallback;
}

function parseCorsOrigin(raw: string | undefined): string[] {
  const value = raw ?? DEFAULT_CORS;
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseNodeEnv(raw: string | undefined): AppConfiguration['nodeEnv'] {
  if (raw === 'production' || raw === 'test' || raw === 'development') {
    return raw;
  }
  return 'development';
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw === 'true' || raw === '1';
}

function parseOAuth(
  clientId: string | undefined,
  clientSecret: string | undefined,
  callbackUrl: string | undefined,
): OAuthProviderConfig | null {
  if (!clientId || !clientSecret || !callbackUrl) return null;
  return { clientId, clientSecret, callbackUrl };
}

function parseSmtp(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return {
    host,
    port: parsePort(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    secure: parseBool(process.env.SMTP_SECURE, false),
  };
}

export default (): AppConfiguration => {
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
  const isProd = nodeEnv === 'production';

  // In dev we fall back to deterministic dummy secrets so the app boots without
  // requiring a full .env. Production refuses to start without explicit secrets
  // (env.validation enforces this).
  const accessSecret =
    process.env.JWT_ACCESS_SECRET ??
    (isProd ? '' : 'dev-access-secret-change-me');
  const refreshSecret =
    process.env.JWT_REFRESH_SECRET ??
    (isProd ? '' : 'dev-refresh-secret-change-me');

  return {
    nodeEnv,
    port: parsePort(process.env.PORT, DEFAULT_PORT),
    corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
    frontendUrl: process.env.FRONTEND_URL ?? DEFAULT_FRONTEND,
    uploadsDir: process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads'),
    database: {
      url: process.env.DATABASE_URL ?? '',
    },
    auth: {
      accessSecret,
      accessTtl: process.env.JWT_ACCESS_TTL ?? DEFAULT_ACCESS_TTL,
      refreshSecret,
      refreshTtl: process.env.JWT_REFRESH_TTL ?? DEFAULT_REFRESH_TTL,
      refreshCookieName:
        process.env.REFRESH_COOKIE_NAME ?? DEFAULT_REFRESH_COOKIE,
      refreshCookieDomain: process.env.REFRESH_COOKIE_DOMAIN,
      accessCookieName: process.env.ACCESS_COOKIE_NAME ?? DEFAULT_ACCESS_COOKIE,
      verifyTokenTtlMinutes: parsePort(
        process.env.EMAIL_VERIFY_TTL_MINUTES,
        DEFAULT_VERIFY_TTL_MINUTES,
      ),
      passwordResetTtlMinutes: parsePort(
        process.env.PASSWORD_RESET_TTL_MINUTES,
        DEFAULT_PASSWORD_RESET_TTL_MINUTES,
      ),
      oauthSuccessRedirect:
        process.env.OAUTH_SUCCESS_REDIRECT ??
        `${DEFAULT_FRONTEND}/auth/callback`,
      oauthFailureRedirect:
        process.env.OAUTH_FAILURE_REDIRECT ??
        `${DEFAULT_FRONTEND}/login?error=oauth`,
      emailVerifyRedirect:
        process.env.EMAIL_VERIFY_REDIRECT ??
        `${DEFAULT_FRONTEND}/auth/verify-email`,
      passwordResetRedirect:
        process.env.PASSWORD_RESET_REDIRECT ??
        `${DEFAULT_FRONTEND}/auth/reset-password`,
      google: parseOAuth(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL,
      ),
      github: parseOAuth(
        process.env.GITHUB_CLIENT_ID,
        process.env.GITHUB_CLIENT_SECRET,
        process.env.GITHUB_CALLBACK_URL,
      ),
    },
    smtp: parseSmtp(),
    emailFrom: process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
  };
};
