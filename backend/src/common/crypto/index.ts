import { createHash } from 'node:crypto';

/**
 * Hash an opaque token (refresh / verification / reset) for storage at rest.
 * Tokens are high-entropy random strings, so a plain SHA-256 is sufficient —
 * the digest is what we persist and look up, never the raw token.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
