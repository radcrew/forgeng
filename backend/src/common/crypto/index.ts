import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

/**
 * Hash an opaque token (refresh / verification / reset) for storage at rest.
 * Tokens are high-entropy random strings, so a plain SHA-256 is sufficient —
 * the digest is what we persist and look up, never the raw token.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const CIPHER = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
// The format version. A new key or cipher later gets "v2:", and old values
// still decrypt.
const PREFIX = 'v1:';

/**
 * Reads an encryption key given as base64, for example from an env var. It
 * must be 32 random bytes: `openssl rand -base64 32` makes one.
 */
export function parseEncryptionKey(raw: string): Buffer {
  const key = Buffer.from(raw.trim(), 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `The encryption key must be ${KEY_BYTES} bytes in base64, but it is ${key.length} bytes.`,
    );
  }
  return key;
}

/**
 * Encrypts a secret that must be read back later, such as an OAuth refresh
 * token. For a secret that is only compared, use `hashToken` instead.
 *
 * AES-256-GCM with a new random IV each time, so the same secret never
 * gives the same text twice. The result is `v1:` and then the IV, the
 * authentication tag and the encrypted bytes, in base64.
 */
export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(CIPHER, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Reads a value from `encryptSecret`. Throws when the key is wrong or the
 * stored text was changed, so a damaged value is never used.
 */
export function decryptSecret(payload: string, key: Buffer): string {
  if (!payload.startsWith(PREFIX)) {
    throw new Error('Unknown encrypted value format.');
  }
  const bytes = Buffer.from(payload.slice(PREFIX.length), 'base64');
  if (bytes.length < IV_BYTES + TAG_BYTES) {
    throw new Error('The encrypted value is too short.');
  }
  const iv = bytes.subarray(0, IV_BYTES);
  const tag = bytes.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const encrypted = bytes.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(CIPHER, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}
