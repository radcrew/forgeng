import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2EApp, makeAuthUser, type E2EContext } from './support/e2e-app';

/** Who can read and change the Slack invite link. */
describe('Slack invite link (e2e)', () => {
  let ctx: E2EContext;
  const http = () => ctx.app.getHttpServer() as App;
  const url = '/api/settings/slack-invite';
  const link = 'https://join.slack.com/t/forgeng/shared_invite/zt-abc123';

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('forbids an applicant from reading it (403)', () => {
    ctx.setUser(makeAuthUser('applicant'));
    return request(http()).get(url).expect(403);
  });

  it('shows it to a student (200)', () => {
    ctx.setUser(makeAuthUser('student'));
    ctx.prisma.platformSetting.findUnique.mockResolvedValue({
      slackInviteUrl: link,
    });

    return request(http())
      .get(url)
      .expect(200)
      .expect({ slackInviteUrl: link });
  });

  it('forbids a student from changing it (403)', () => {
    ctx.setUser(makeAuthUser('student'));
    return request(http())
      .patch(url)
      .send({ slackInviteUrl: link })
      .expect(403);
  });

  it('lets an admin save a Slack invite link (200)', () => {
    ctx.setUser(makeAuthUser('admin'));
    ctx.prisma.platformSetting.upsert.mockResolvedValue({
      slackInviteUrl: link,
    });

    return request(http())
      .patch(url)
      .send({ slackInviteUrl: link })
      .expect(200)
      .expect({ slackInviteUrl: link });
  });

  it('refuses a link that is not a Slack invite (400)', () => {
    ctx.setUser(makeAuthUser('admin'));
    return request(http())
      .patch(url)
      .send({ slackInviteUrl: 'https://evil.example.com/join' })
      .expect(400);
  });
});
