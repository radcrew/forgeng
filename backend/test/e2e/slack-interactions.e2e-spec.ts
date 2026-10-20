import { createHmac } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, type E2EContext } from './support/e2e-app';

const SECRET = 'e2e-slack-signing-secret';

/** A form post signed the way Slack signs its interaction posts. */
const signed = (payload: unknown) => {
  const raw = `payload=${encodeURIComponent(JSON.stringify(payload))}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `v0=${createHmac('sha256', SECRET)
    .update(`v0:${timestamp}:${raw}`)
    .digest('hex')}`;
  return { raw, timestamp, signature };
};

const CLICK = {
  type: 'block_actions',
  trigger_id: 'trigger-1',
  user: { id: 'U0MENTOR' },
  actions: [{ action_id: 'approve_submission', value: '9' }],
};

/** Slack's interactions route, with real signed form posts. */
describe('Slack interactions (e2e)', () => {
  let ctx: E2EContext;
  const http = () => ctx.app.getHttpServer() as App;
  const realFetch = global.fetch;
  const fetchMock = jest.fn();
  const saved = {
    token: process.env.SLACK_BOT_TOKEN,
    secret: process.env.SLACK_SIGNING_SECRET,
  };

  const post = (req: ReturnType<typeof signed>) =>
    request(http())
      .post('/api/slack/interactions')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('X-Slack-Request-Timestamp', req.timestamp)
      .set('X-Slack-Signature', req.signature)
      .send(req.raw);

  beforeAll(async () => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-e2e';
    process.env.SLACK_SIGNING_SECRET = SECRET;
    ctx = await createE2EApp();
    ctx.setUser(null);
  });

  beforeEach(() => {
    // Stands in for Slack's Web API, so the test makes no network call.
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  afterAll(async () => {
    await ctx.app.close();
    if (saved.token === undefined) delete process.env.SLACK_BOT_TOKEN;
    else process.env.SLACK_BOT_TOKEN = saved.token;
    if (saved.secret === undefined) delete process.env.SLACK_SIGNING_SECRET;
    else process.env.SLACK_SIGNING_SECRET = saved.secret;
  });

  it('opens a form in Slack when Approve is clicked, before answering', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue({ role: 'admin' });
    ctx.prisma.submission.findUnique.mockResolvedValue({
      status: 'submitted',
      task: { title: 'Build a CLI' },
      user: { name: 'Ada', email: 'ada@example.com' },
    });

    await post(signed(CLICK)).expect(200);

    const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(url).toBe('https://slack.com/api/views.open');
    expect(JSON.parse(init.body)).toMatchObject({
      trigger_id: 'trigger-1',
      view: { callback_id: 'approve_submission', private_metadata: '9' },
    });
  });

  it('still answers 200 when Slack refuses to open the form', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(null);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: false, error: 'expired_trigger_id' }),
    });

    await post(signed(CLICK)).expect(200);
  });

  it('refuses an unsigned post (401)', async () => {
    await request(http())
      .post('/api/slack/interactions')
      .type('form')
      .send({ payload: JSON.stringify(CLICK) })
      .expect(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a post whose payload was changed after signing (401)', async () => {
    const req = signed(CLICK);
    const changed = signed({ ...CLICK, user: { id: 'U0OTHER' } });

    await post({ ...req, raw: changed.raw }).expect(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
