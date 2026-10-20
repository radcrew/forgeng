import { timingSafeEqual } from 'node:crypto';

/**
 * True when a request comes from Vercel Cron, which sends the CRON_SECRET
 * env var as `Authorization: Bearer <secret>`. Without a secret, nothing is
 * accepted, so the cron routes stay closed. Compares in constant time, so
 * the answer time doesn't leak the secret.
 */
export function isCronRequest(
  authorization: string | undefined,
  secret: string | undefined,
): boolean {
  if (!secret) return false;
  const given = Buffer.from(authorization ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
