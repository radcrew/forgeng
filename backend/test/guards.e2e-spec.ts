import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, makeAuthUser, type E2EContext } from './utils/e2e-app';

/**
 * Exercises the global JWT + Roles guard chain through the tasks module, which
 * has both unguarded-but-authenticated routes (GET) and admin-only routes
 * (POST/PATCH/DELETE). Verifies the guard matrix end to end rather than any
 * one endpoint's business logic.
 */
describe('Guard chain (e2e)', () => {
  let ctx: E2EContext;
  const http = () => ctx.app.getHttpServer() as App;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('admin-only routes', () => {
    const validTask = { cohortId: 1, title: 'New task', type: 'coding' };

    it('forbids an unauthenticated request (403)', () => {
      ctx.setUser(null);
      return request(http()).post('/api/tasks').send(validTask).expect(403);
    });

    it('forbids a student on an admin route (403)', () => {
      ctx.setUser(makeAuthUser('student'));
      return request(http()).post('/api/tasks').send(validTask).expect(403);
    });

    it('forbids an applicant on an admin route (403)', () => {
      ctx.setUser(makeAuthUser('applicant'));
      return request(http()).post('/api/tasks').send(validTask).expect(403);
    });

    it('allows an admin through the guard chain (201)', () => {
      ctx.setUser(makeAuthUser('admin'));
      ctx.prisma.task.create.mockResolvedValue({
        id: 1,
        cohortId: 1,
        title: 'New task',
        description: null,
        type: 'coding',
        status: 'draft',
        dueDate: null,
        createdAt: new Date('2026-01-15T10:30:00.000Z'),
      });
      ctx.prisma.submission.count.mockResolvedValue(0);

      return request(http())
        .post('/api/tasks')
        .send(validTask)
        .expect(201)
        .expect((res) => {
          const body = res.body as { id: number };
          expect(body.id).toBe(1);
        });
    });

    it('runs validation only after the guard passes (admin, bad body -> 400)', () => {
      ctx.setUser(makeAuthUser('admin'));
      return request(http())
        .post('/api/tasks')
        .send({ title: 'missing cohortId and type' })
        .expect(400);
    });
  });

  describe('non-role-restricted routes', () => {
    // Note: the harness bypasses the real JWT guard, so it does not assert the
    // "must be authenticated" behavior on routes without @Roles — only role
    // enforcement (RolesGuard) is exercised here. A route with no @Roles is
    // therefore reachable by any role we attach.
    it('allows any authenticated role to list tasks (200)', () => {
      ctx.setUser(makeAuthUser('student'));
      // Student with no enrollments => empty list, no further prisma calls.
      ctx.prisma.enrollment.findMany.mockResolvedValue([]);

      return request(http())
        .get('/api/tasks')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });
});
