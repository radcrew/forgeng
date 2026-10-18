import { Prisma } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, makeAuthUser, type E2EContext } from './support/e2e-app';

/**
 * Exercises the global JWT + Roles guard chain through the tasks module, which
 * has student-and-admin routes (GET) and admin-only routes
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

    it('answers 404 when the cohort does not exist', () => {
      ctx.setUser(makeAuthUser('admin'));
      // What the database does for a task that links to a missing cohort.
      ctx.prisma.task.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint violated',
          { code: 'P2003', clientVersion: 'test' },
        ),
      );

      return request(http())
        .post('/api/tasks')
        .send({ ...validTask, cohortId: 99 })
        .expect(404);
    });

    it('runs validation only after the guard passes (admin, bad body -> 400)', () => {
      ctx.setUser(makeAuthUser('admin'));
      return request(http())
        .post('/api/tasks')
        .send({ title: 'missing cohortId and type' })
        .expect(400);
    });
  });

  describe('student and admin routes', () => {
    // Tasks, submissions, and feedback are limited to students and admins.
    // The services only narrow what a student sees, so an applicant let
    // through would get the unfiltered admin view.
    it.each([
      ['get', '/api/tasks'],
      ['get', '/api/tasks/1'],
      ['get', '/api/submissions'],
      ['get', '/api/submissions/1'],
      ['post', '/api/submissions'],
      ['patch', '/api/submissions/1'],
      ['get', '/api/submissions/1/feedback'],
    ] as const)('forbids an applicant: %s %s (403)', (method, path) => {
      ctx.setUser(makeAuthUser('applicant'));
      return request(http())[method](path).send({}).expect(403);
    });

    it('allows a student to list tasks (200)', () => {
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
