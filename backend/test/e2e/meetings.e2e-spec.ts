import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, makeAuthUser, type E2EContext } from './support/e2e-app';

/** Who can use the meeting routes, and what the server checks first. */
describe('Meetings (e2e)', () => {
  let ctx: E2EContext;
  const http = () => ctx.app.getHttpServer() as App;
  const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const valid = () => ({
    attendeeId: 7,
    title: 'Mentoring call',
    startsAt: inAnHour(),
    durationMinutes: 30,
  });

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('forbids an applicant from listing meetings (403)', () => {
    ctx.setUser(makeAuthUser('applicant'));
    return request(http()).get('/api/meetings').expect(403);
  });

  it('lists a student their meetings (200)', () => {
    ctx.setUser(makeAuthUser('student'));
    ctx.prisma.meeting.findMany.mockResolvedValue([]);
    return request(http()).get('/api/meetings').expect(200).expect([]);
  });

  it('forbids a student from scheduling (403)', () => {
    ctx.setUser(makeAuthUser('student'));
    return request(http()).post('/api/meetings').send(valid()).expect(403);
  });

  it.each([
    ['a length under 15 minutes', { durationMinutes: 5 }],
    ['a blank title', { title: '   ' }],
    ['a time that is not a date', { startsAt: 'tomorrow' }],
  ])('refuses %s (400)', (_, change) => {
    ctx.setUser(makeAuthUser('admin'));
    return request(http())
      .post('/api/meetings')
      .send({ ...valid(), ...change })
      .expect(400);
  });

  it('answers 503 when the server has no Google Calendar settings', () => {
    ctx.setUser(makeAuthUser('admin'));
    ctx.prisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: 'ada@example.com',
      role: 'student',
    });
    return request(http()).post('/api/meetings').send(valid()).expect(503);
  });

  it('forbids a student from cancelling (403)', () => {
    ctx.setUser(makeAuthUser('student'));
    return request(http()).delete('/api/meetings/5').expect(403);
  });
});
