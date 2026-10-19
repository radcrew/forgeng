import { randomBytes } from 'node:crypto';
import {
  createOAuthState,
  STATE_TTL_MS,
  verifyOAuthState,
} from '@modules/meetings/oauth-state';

const key = randomBytes(32);
const NOW = 1_800_000_000_000;

describe('OAuth state', () => {
  it('gives back the admin who started the connection', () => {
    const { state, nonce } = createOAuthState(7, key, NOW);

    expect(verifyOAuthState(state, nonce, key, NOW + 1000)).toBe(7);
  });

  it('refuses a state from another browser (wrong nonce cookie)', () => {
    const { state } = createOAuthState(7, key, NOW);
    const other = createOAuthState(7, key, NOW).nonce;

    expect(verifyOAuthState(state, other, key, NOW)).toBeNull();
  });

  it('refuses a state with no nonce cookie', () => {
    const { state } = createOAuthState(7, key, NOW);

    expect(verifyOAuthState(state, undefined, key, NOW)).toBeNull();
  });

  it('refuses an expired state', () => {
    const { state, nonce } = createOAuthState(7, key, NOW);

    expect(
      verifyOAuthState(state, nonce, key, NOW + STATE_TTL_MS + 1),
    ).toBeNull();
  });

  it('refuses a state whose admin id was changed', () => {
    const { state, nonce } = createOAuthState(7, key, NOW);
    const [body, signature] = state.split('.');
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
    const forged = Buffer.from(
      JSON.stringify({ ...payload, userId: 1 }),
    ).toString('base64url');

    expect(
      verifyOAuthState(`${forged}.${signature}`, nonce, key, NOW),
    ).toBeNull();
  });

  it('refuses a state signed with another key', () => {
    const { state, nonce } = createOAuthState(7, randomBytes(32), NOW);

    expect(verifyOAuthState(state, nonce, key, NOW)).toBeNull();
  });

  it.each(['', 'no-dot', 'a.b.c', '.'])('refuses a malformed state %p', (s) => {
    expect(verifyOAuthState(s, 'nonce', key, NOW)).toBeNull();
  });
});
