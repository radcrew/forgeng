import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** How long an admin has to finish Google's consent screen. */
export const STATE_TTL_MS = 10 * 60 * 1000;

interface StatePayload {
  /** The admin who started the connection. */
  userId: number;
  /** Also kept in a cookie in the admin's browser. */
  nonce: string;
  /** Expiry, in milliseconds since 1970. */
  expiresAt: number;
}

// A separate key for signing, made from the token key, so the encryption key
// itself is never used to sign anything.
const signingKey = (tokenKey: Buffer) =>
  createHmac('sha256', tokenKey).update('google-calendar-oauth-state').digest();

const sign = (body: string, tokenKey: Buffer) =>
  createHmac('sha256', signingKey(tokenKey)).update(body).digest('base64url');

/**
 * Makes the `state` value sent to Google, and the nonce to keep in the
 * admin's browser. Google sends the state back to the callback unchanged.
 */
export function createOAuthState(
  userId: number,
  tokenKey: Buffer,
  now = Date.now(),
): { state: string; nonce: string } {
  const nonce = randomBytes(16).toString('base64url');
  const payload: StatePayload = {
    userId,
    nonce,
    expiresAt: now + STATE_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { state: `${body}.${sign(body, tokenKey)}`, nonce };
}

/**
 * Checks a `state` from Google's callback and returns the admin's id, or
 * null when it was changed, has expired, or doesn't match the browser's
 * nonce cookie. The nonce check stops someone from making another browser
 * finish a connection they started.
 */
export function verifyOAuthState(
  state: string,
  nonceCookie: string | undefined,
  tokenKey: Buffer,
  now = Date.now(),
): number | null {
  const [body, signature] = state.split('.');
  if (!body || !signature || !nonceCookie) return null;

  const expected = Buffer.from(sign(body, tokenKey));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  let payload: StatePayload;
  try {
    payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as StatePayload;
  } catch {
    return null;
  }
  if (payload.expiresAt < now) return null;

  const nonce = Buffer.from(payload.nonce);
  const cookie = Buffer.from(nonceCookie);
  if (nonce.length !== cookie.length || !timingSafeEqual(nonce, cookie)) {
    return null;
  }
  return payload.userId;
}
