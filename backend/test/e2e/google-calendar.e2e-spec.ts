import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, makeAuthUser, type E2EContext } from './support/e2e-app';

/**
 * Who can use the Google Calendar connection routes. The test server has no
 * Google Calendar settings, so the feature reports itself as off.
 */
describe('Google Calendar connection (e2e)', () => {
  let ctx: E2EContext;
  const http = () => ctx.app.getHttpServer() as App;
  const base = '/api/integrations/google-calendar';

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('forbids a student (403)', () => {
    ctx.setUser(makeAuthUser('student'));
    return request(http()).get(base).expect(403);
  });

  it('shows an admin that the feature is off on this server (200)', () => {
    ctx.setUser(makeAuthUser('admin'));
    ctx.prisma.googleCalendarConnection.findUnique.mockResolvedValue(null);

    return request(http())
      .get(base)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          configured: false,
          connected: false,
          googleEmail: null,
          broken: false,
        });
      });
  });

  it('answers 404 to connect when the feature is off', () => {
    ctx.setUser(makeAuthUser('admin'));
    return request(http()).get(`${base}/connect`).expect(404);
  });

  it('sends the browser back to settings with the reason when it fails', () => {
    // Public: Google sends the browser here without a Forgeng login.
    ctx.setUser(null);
    return request(http())
      .get(`${base}/callback?code=c&state=s`)
      .expect(302)
      .expect('Location', /\/admin\/settings\?googleCalendar=not_configured$/);
  });

  it('forbids a student from disconnecting (403)', () => {
    ctx.setUser(makeAuthUser('student'));
    return request(http()).delete(base).expect(403);
  });
});
