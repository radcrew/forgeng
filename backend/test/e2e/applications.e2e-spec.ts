import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, makeAuthUser, type E2EContext } from './support/e2e-app';

const DATE = new Date('2026-01-15T10:30:00.000Z');

// A valid CreateApplicationDto body — every required field passes its validator.
const validBody = {
  motivation: 'I want to join because I love building.',
  background: 'Self-taught developer with two years of side projects.',
  linkedin: 'https://linkedin.com/in/jane-doe',
  github: 'https://github.com/jane-doe',
  videoUrl: 'https://example.com/intro.mp4',
  country: 'US',
};

function applicationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    userId: 1,
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    status: 'pending',
    motivation: validBody.motivation,
    background: validBody.background,
    experience: null,
    linkedin: validBody.linkedin,
    twitter: null,
    facebook: null,
    github: validBody.github,
    portfolio: null,
    telegram: null,
    whatsapp: null,
    country: 'US',
    videoUrl: validBody.videoUrl,
    wallets: [],
    reviewerNote: null,
    cohortId: null,
    createdAt: DATE,
    ...overrides,
  };
}

describe('Applications (e2e)', () => {
  let ctx: E2EContext;
  const http = () => ctx.app.getHttpServer() as App;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('role enforcement', () => {
    it('forbids a student from the admin-only stats route (403)', () => {
      ctx.setUser(makeAuthUser('student'));
      return request(http()).get('/api/applications/stats').expect(403);
    });

    it('forbids an applicant from creating via the wrong role on stats (403)', () => {
      ctx.setUser(makeAuthUser('applicant'));
      return request(http()).get('/api/applications/stats').expect(403);
    });

    it('allows an admin to read stats (200)', () => {
      ctx.setUser(makeAuthUser('admin'));
      ctx.prisma.application.groupBy.mockResolvedValue([
        { status: 'pending', _count: { _all: 2 } },
        { status: 'accepted', _count: { _all: 1 } },
      ]);

      return request(http())
        .get('/api/applications/stats')
        .expect(200)
        .expect({ pending: 2, accepted: 1, rejected: 0, total: 3 });
    });
  });

  describe('POST /api/applications validation', () => {
    beforeEach(() => {
      ctx.setUser(makeAuthUser('applicant'));
    });

    it('rejects an empty body (400)', () => {
      return request(http()).post('/api/applications').send({}).expect(400);
    });

    it('rejects a non-profile github URL (400)', () => {
      return request(http())
        .post('/api/applications')
        .send({ ...validBody, github: 'https://github.com/jane/some-repo' })
        .expect(400);
    });

    it('rejects unknown extra properties (400)', () => {
      return request(http())
        .post('/api/applications')
        .send({ ...validBody, hacker: 'field' })
        .expect(400);
    });

    it('creates an application for a valid body (201)', () => {
      ctx.prisma.application.findUnique.mockResolvedValue(null);
      ctx.prisma.application.create.mockResolvedValue(applicationRow());
      // The post-create admin notification reads the admin list; an empty list
      // lets that best-effort path complete quietly.
      ctx.prisma.user.findMany.mockResolvedValue([]);

      return request(http())
        .post('/api/applications')
        .send(validBody)
        .expect(201)
        .expect((res) => {
          const body = res.body as { id: number; status: string };
          expect(body.id).toBe(10);
          expect(body.status).toBe('pending');
        });
    });
  });

  describe('GET /api/applications/me', () => {
    it('returns null when the applicant has no application (200)', () => {
      ctx.setUser(makeAuthUser('applicant'));
      ctx.prisma.application.findUnique.mockResolvedValue(null);

      return request(http())
        .get('/api/applications/me')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({});
        });
    });

    it('hides the internal reviewerNote from the applicant view', () => {
      ctx.setUser(makeAuthUser('applicant'));
      ctx.prisma.application.findUnique.mockResolvedValue(
        applicationRow({ reviewerNote: 'internal only' }),
      );

      return request(http())
        .get('/api/applications/me')
        .expect(200)
        .expect((res) => {
          const body = res.body as { reviewerNote: string | null };
          expect(body.reviewerNote).toBeNull();
        });
    });
  });
});
