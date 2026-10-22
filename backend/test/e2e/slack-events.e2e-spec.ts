import { createHmac } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, type E2EContext } from './support/e2e-app';

const SECRET = 'e2e-slack-signing-secret';

/** A request signed the way Slack signs it. */
const signed = (body: unknown, timestamp = Math.floor(Date.now() / 1000)) => {
  const raw = JSON.stringify(body);
  const signature = `v0=${createHmac('sha256', SECRET)
    .update(`v0:${timestamp}:${raw}`)
    .digest('hex')}`;
  return { raw, timestamp: String(timestamp), signature };
};

/** Slack's events route, checked with real signed requests. */
describe('Slack events (e2e)', () => {
  let ctx: E2EContext;
  const http = () => ctx.app.getHttpServer() as App;
  const saved = {
    token: process.env.SLACK_BOT_TOKEN,
    secret: process.env.SLACK_SIGNING_SECRET,
  };

  const post = (req: ReturnType<typeof signed>) =>
    request(http())
      .post('/api/slack/events')
      .set('Content-Type', 'application/json')
      .set('X-Slack-Request-Timestamp', req.timestamp)
      .set('X-Slack-Signature', req.signature)
      .send(req.raw);

  beforeAll(async () => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-e2e';
    process.env.SLACK_SIGNING_SECRET = SECRET;
    ctx = await createE2EApp();
    // Public: Slack calls without a Forgeng login.
    ctx.setUser(null);
  });

  afterAll(async () => {
    await ctx.app.close();
    // Other test files in this worker must not see Slack turned on.
    process.env.SLACK_BOT_TOKEN = saved.token;
    process.env.SLACK_SIGNING_SECRET = saved.secret;
    if (saved.token === undefined) delete process.env.SLACK_BOT_TOKEN;
    if (saved.secret === undefined) delete process.env.SLACK_SIGNING_SECRET;
  });

  it("answers Slack's URL check with the challenge", () => {
    return post(signed({ type: 'url_verification', challenge: 'abc123' }))
      .expect(200)
      .expect({ challenge: 'abc123' });
  });

  it('accepts a signed event with an empty 200', () => {
    return post(
      signed({ type: 'event_callback', event: { type: 'team_join' } }),
    ).expect(200);
  });

  it('answers a new member at once, then looks them up after the answer', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(null);

    await post(
      signed({
        type: 'event_callback',
        event: {
          type: 'team_join',
          user: { id: 'U0ADA', profile: { email: 'ada@example.com' } },
        },
      }),
    ).expect(200);

    // After the answer, so give the background work a moment.
    for (
      let i = 0;
      i < 20 && !ctx.prisma.user.findUnique.mock.calls.length;
      i++
    ) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(ctx.prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'ada@example.com' } }),
    );
  });

  it('refuses a request without a signature (401)', () => {
    return request(http())
      .post('/api/slack/events')
      .send({ type: 'url_verification', challenge: 'abc123' })
      .expect(401);
  });

  it('refuses a request with a wrong signature (401)', () => {
    const req = signed({ type: 'url_verification', challenge: 'abc123' });
    return post({ ...req, signature: `v0=${'0'.repeat(64)}` }).expect(401);
  });

  it('refuses an old request, so it cannot be replayed (401)', () => {
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - 10 * 60;
    return post(
      signed({ type: 'url_verification', challenge: 'abc123' }, tenMinutesAgo),
    ).expect(401);
  });

  it("is not slowed by the app's per-address limit (100 a minute)", async () => {
    // All Slack traffic comes from a few addresses.
    const statuses = new Set<number>();
    for (let i = 0; i < 110; i++) {
      const res = await post(signed({ type: 'event_callback', event: {} }));
      statuses.add(res.status);
    }
    expect([...statuses]).toEqual([200]);
  });
});
