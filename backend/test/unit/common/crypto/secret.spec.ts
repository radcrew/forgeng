import { randomBytes } from 'node:crypto';
import {
  decryptSecret,
  encryptSecret,
  parseEncryptionKey,
} from '../../../../src/common/crypto';

const key = randomBytes(32);
const token = '1//0gRefreshTokenFromGoogle-abc_123';

describe('encryptSecret and decryptSecret', () => {
  it('gets the same secret back', () => {
    expect(decryptSecret(encryptSecret(token, key), key)).toBe(token);
  });

  it('never stores the secret as plain text', () => {
    const stored = encryptSecret(token, key);

    expect(stored.startsWith('v1:')).toBe(true);
    expect(stored).not.toContain(token);
  });

  it('gives a different result each time for the same secret', () => {
    expect(encryptSecret(token, key)).not.toBe(encryptSecret(token, key));
  });

  it('refuses a wrong key', () => {
    const stored = encryptSecret(token, key);

    expect(() => decryptSecret(stored, randomBytes(32))).toThrow();
  });

  it('refuses a value that was changed', () => {
    const bytes = Buffer.from(encryptSecret(token, key).slice(3), 'base64');
    bytes[bytes.length - 1] ^= 1;

    expect(() =>
      decryptSecret(`v1:${bytes.toString('base64')}`, key),
    ).toThrow();
  });

  it.each([
    ['an unknown format', 'v9:abc'],
    ['a value that is too short', 'v1:YWJj'],
  ])('refuses %s', (_, value) => {
    expect(() => decryptSecret(value, key)).toThrow();
  });
});

describe('parseEncryptionKey', () => {
  it('reads a 32-byte key from base64', () => {
    const raw = key.toString('base64');

    expect(parseEncryptionKey(` ${raw}\n`).equals(key)).toBe(true);
  });

  it('refuses a key of the wrong length', () => {
    expect(() =>
      parseEncryptionKey(randomBytes(16).toString('base64')),
    ).toThrow('The encryption key must be 32 bytes');
  });
});
