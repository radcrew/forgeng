import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, makeAuthUser, type E2EContext } from './support/e2e-app';

/** Who can see mentors' booking pages, and who can change their own. */
describe('Mentors (e2e)', () => {
  let ctx: E2EContext;
  const http = () => ctx.app.getHttpServer() as App;
  const link = 'https://calendar.app.google/AbCd1234';

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('GET /api/mentors', () => {
    it('forbids an applicant (403)', () => {
      ctx.setUser(makeAuthUser('applicant'));
      return request(http()).get('/api/mentors').expect(403);
    });

    it('lists mentors for a student (200)', () => {
      ctx.setUser(makeAuthUser('student'));
      ctx.prisma.user.findMany.mockResolvedValue([
        { id: 1, name: 'Grace', avatarUrl: null, bookingUrl: link },
      ]);

      return request(http())
        .get('/api/mentors')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([
            { id: 1, name: 'Grace', avatarUrl: null, bookingUrl: link },
          ]);
        });
    });
  });

  describe('PATCH /api/mentors/me/booking-url', () => {
    it('forbids a student (403)', () => {
      ctx.setUser(makeAuthUser('student'));
      return request(http())
        .patch('/api/mentors/me/booking-url')
        .send({ bookingUrl: link })
        .expect(403);
    });

    it('saves a Google booking page for an admin (200)', () => {
      ctx.setUser(makeAuthUser('admin'));
      ctx.prisma.user.update.mockResolvedValue({ bookingUrl: link });

      return request(http())
        .patch('/api/mentors/me/booking-url')
        .send({ bookingUrl: link })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ bookingUrl: link });
        });
    });

    it('refuses a link that is not a Google booking page (400)', () => {
      ctx.setUser(makeAuthUser('admin'));
      return request(http())
        .patch('/api/mentors/me/booking-url')
        .send({ bookingUrl: 'https://evil.example.com/book' })
        .expect(400);
    });
  });
});
