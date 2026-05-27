import type { AppConfiguration } from './config.types';

const DEFAULT_PORT = 3001;
const DEFAULT_CORS = 'http://localhost:3000';

function parsePort(raw: string | undefined): number {
  const port = Number.parseInt(raw ?? String(DEFAULT_PORT), 10);
  return Number.isFinite(port) ? port : DEFAULT_PORT;
}

function parseCorsOrigin(raw: string | undefined): string[] {
  const value = raw ?? DEFAULT_CORS;
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseNodeEnv(
  raw: string | undefined,
): AppConfiguration['nodeEnv'] {
  if (raw === 'production' || raw === 'test' || raw === 'development') {
    return raw;
  }
  return 'development';
}

export default (): AppConfiguration => ({
  nodeEnv: parseNodeEnv(process.env.NODE_ENV),
  port: parsePort(process.env.PORT),
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
});
