import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, type E2EContext } from './support/e2e-app';

const SECRET = 'e2e-cron-secret';

/** The nightly Slack channel check, called by Vercel Cron. */
describe('Slack channel check (e2e)', () => {
  let ctx: E2EContext;
  const http = () => ctx.app.getHttpServer() as App;
  const url = '/api/cron/sync-slack-channels';
  const saved = process.env.CRON_SECRET;

  beforeAll(async () => {
    process.env.CRON_SECRET = SECRET;
    ctx = await createE2EApp();
    // Public: Vercel Cron calls without a Forgeng login.
    ctx.setUser(null);
  });

  afterAll(async () => {
    await ctx.app.close();
    if (saved === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = saved;
  });

  it('runs for the Vercel Cron secret (200)', () => {
    // Slack isn't set up in tests, so the check has nothing to do.
    return request(http())
      .get(url)
      .set('Authorization', `Bearer ${SECRET}`)
      .expect(200)
      .expect({ channels: 0, added: 0, removed: 0 });
  });

  it.each([
    ['no secret', undefined],
    ['a wrong secret', 'Bearer nope'],
  ])('refuses a call with %s (401)', (_, header) => {
    const call = request(http()).get(url);
    return (header ? call.set('Authorization', header) : call).expect(401);
  });
});
