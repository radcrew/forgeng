import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { SlackService } from '@core/slack';
import { SlackMembersService } from '@modules/slack/slack-members.service';

const MEMBER = {
  id: 'U0ADA',
  profile: { email: 'Ada@Example.com' },
};
const STUDENT = { id: 7, role: 'student', name: 'Ada', slackUserId: null };

describe('SlackMembersService', () => {
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    enrollment: { findMany: jest.Mock };
  };
  let slack: { inviteToChannel: jest.Mock; postInBackground: jest.Mock };
  let service: SlackMembersService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(STUDENT),
        update: jest.fn().mockResolvedValue({}),
      },
      enrollment: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { cohort: { slackChannelId: 'CSPRING' } },
            { cohort: { slackChannelId: 'CAUTUMN' } },
          ]),
      },
    };
    slack = {
      inviteToChannel: jest.fn().mockResolvedValue(undefined),
      postInBackground: jest.fn(),
    };
    service = new SlackMembersService(
      prisma as unknown as PrismaService,
      slack as unknown as SlackService,
      { get: () => 'https://app.example' } as never,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('finds the Forgeng user by email, ignoring case', async () => {
    await service.handleTeamJoin(MEMBER);

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'ada@example.com' } }),
    );
  });

  it('links the Slack account to the student', async () => {
    await service.handleTeamJoin(MEMBER);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { slackUserId: 'U0ADA' },
    });
  });

  it("adds the student to every cohort's channel", async () => {
    await service.handleTeamJoin(MEMBER);

    expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 7, cohort: { slackChannelId: { not: null } } },
      }),
    );
    expect(slack.inviteToChannel).toHaveBeenCalledWith('CSPRING', 'U0ADA');
    expect(slack.inviteToChannel).toHaveBeenCalledWith('CAUTUMN', 'U0ADA');
  });

  it('keeps going when one channel fails', async () => {
    slack.inviteToChannel.mockRejectedValueOnce(new Error('channel_not_found'));

    await service.handleTeamJoin(MEMBER);

    expect(slack.inviteToChannel).toHaveBeenCalledTimes(2);
  });

  it('sends a welcome message to the new member', async () => {
    await service.handleTeamJoin(MEMBER);

    expect(slack.postInBackground).toHaveBeenCalledWith(
      'U0ADA',
      expect.objectContaining({
        text: expect.stringContaining(
          'Welcome to the Forgeng Slack, Ada!',
        ) as unknown,
        link: { label: 'Open Forgeng', url: 'https://app.example/student' },
      }),
    );
  });

  it('links an admin and welcomes them, without cohort channels', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...STUDENT, role: 'admin' });

    await service.handleTeamJoin(MEMBER);

    expect(prisma.user.update).toHaveBeenCalled();
    expect(slack.inviteToChannel).not.toHaveBeenCalled();
    expect(slack.postInBackground).toHaveBeenCalledWith(
      'U0ADA',
      expect.objectContaining({
        link: { label: 'Open Forgeng', url: 'https://app.example/admin' },
      }),
    );
  });

  it('sends no second welcome when Slack sends the event again', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...STUDENT,
      slackUserId: 'U0ADA',
    });

    await service.handleTeamJoin(MEMBER);

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(slack.postInBackground).not.toHaveBeenCalled();
    // The channels are checked again, which changes nothing.
    expect(slack.inviteToChannel).toHaveBeenCalledTimes(2);
  });

  it('leaves a Slack account alone that belongs to another user', async () => {
    prisma.user.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await service.handleTeamJoin(MEMBER);

    expect(slack.inviteToChannel).not.toHaveBeenCalled();
    expect(slack.postInBackground).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a member with no Forgeng account',
      () => prisma.user.findUnique.mockResolvedValue(null),
    ],
    [
      'an applicant',
      () =>
        prisma.user.findUnique.mockResolvedValue({
          ...STUDENT,
          role: 'applicant',
        }),
    ],
  ])('does nothing for %s', async (_, arrange) => {
    arrange();

    await service.handleTeamJoin(MEMBER);

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(slack.inviteToChannel).not.toHaveBeenCalled();
    expect(slack.postInBackground).not.toHaveBeenCalled();
  });

  it.each([
    ['a bot', { ...MEMBER, is_bot: true }],
    ['a deleted member', { ...MEMBER, deleted: true }],
    ['a member without an email', { id: 'U0ADA', profile: {} }],
  ])('ignores %s without looking anyone up', async (_, member) => {
    await service.handleTeamJoin(member);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
