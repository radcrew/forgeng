import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, type E2EContext } from './support/e2e-app';

describe('Health (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('reports the database up when the probe query succeeds', () => {
    ctx.prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    return request(ctx.app.getHttpServer() as App)
      .get('/api/healthz')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
  });

  it('reports the database down when the probe query throws', () => {
    ctx.prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    return request(ctx.app.getHttpServer() as App)
      .get('/api/healthz')
      .expect(200)
      .expect({ status: 'degraded', database: 'down' });
  });
});
