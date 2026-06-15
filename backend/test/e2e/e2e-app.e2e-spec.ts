import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, type E2EContext } from './support/e2e-app';

describe('E2E harness (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('boots the app with the /api global prefix', () => {
    // An unknown route under the prefix should 404 — proving the app booted
    // and routing is wired, without depending on any specific endpoint.
    return request(ctx.app.getHttpServer() as App)
      .get('/api/__does_not_exist__')
      .expect(404);
  });
});
