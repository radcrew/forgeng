import { createHmac } from 'node:crypto';
import { verifySlackSignature } from '@modules/slack/slack-signature';

const SECRET = 'slack-signing-secret';
const NOW = 1_800_000_000;
const BODY = '{"type":"event_callback","event":{"type":"team_join"}}';

/** Signs a body the way Slack does. */
const sign = (body: string, timestamp: number, secret = SECRET) =>
  `v0=${createHmac('sha256', secret).update(`v0:${timestamp}:${body}`).digest('hex')}`;

const check = (
  overrides: Partial<Parameters<typeof verifySlackSignature>[0]>,
) =>
  verifySlackSignature({
    rawBody: Buffer.from(BODY),
    timestamp: String(NOW),
    signature: sign(BODY, NOW),
    signingSecret: SECRET,
    now: NOW,
    ...overrides,
  });

describe('verifySlackSignature', () => {
  it('accepts a request signed by Slack', () => {
    expect(check({})).toBe(true);
  });

  it('accepts a request sent a few minutes ago', () => {
    expect(check({ now: NOW + 4 * 60 })).toBe(true);
  });

  it('refuses a request older than 5 minutes, so it cannot be replayed', () => {
    expect(check({ now: NOW + 6 * 60 })).toBe(false);
  });

  it('refuses a body that was changed', () => {
    expect(
      check({ rawBody: Buffer.from(BODY.replace('team_join', 'x')) }),
    ).toBe(false);
  });

  it('refuses a signature made with another secret', () => {
    expect(check({ signature: sign(BODY, NOW, 'other-secret') })).toBe(false);
  });

  it('refuses a signature for another timestamp', () => {
    expect(check({ signature: sign(BODY, NOW - 1) })).toBe(false);
  });

  it.each([
    ['no body', { rawBody: undefined }],
    ['no timestamp', { timestamp: undefined }],
    ['no signature', { signature: undefined }],
    ['a timestamp that is not a number', { timestamp: 'soon' }],
    ['a signature of the wrong length', { signature: 'v0=abc' }],
  ])('refuses a request with %s', (_, overrides) => {
    expect(check(overrides)).toBe(false);
  });
});
