import { Logger } from '@nestjs/common';
import { waitUntil } from '@vercel/functions';
import { PrismaService } from '@core/database/prisma.service';
import { SlackChannelsService, SlackService } from '@core/slack';

jest.mock('@vercel/functions', () => ({ waitUntil: jest.fn() }));

/** The promise the last sync handed to waitUntil. */
const handed = () => {
  const calls = (waitUntil as jest.Mock).mock.calls as [Promise<void>][];
  return calls[calls.length - 1][0];
};

describe('SlackChannelsService', () => {
  let prisma: {
    user: { findUnique: jest.Mock; findMany: jest.Mock };
    cohort: { findMany: jest.Mock };
  };
  let slack: {
    enabled: boolean;
    inviteToChannel: jest.Mock;
    removeFromChannel: jest.Mock;
    listChannelMembers: jest.Mock;
  };
  let logError: jest.SpyInstance;
  let service: SlackChannelsService;

  beforeEach(() => {
    jest.clearAllMocks();
    logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ slackUserId: 'U0ADA' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      cohort: {
        findMany: jest.fn().mockResolvedValue([
          // Still enrolled in the new cohort, no longer in the old one.
          { id: 4, slackChannelId: 'CNEW', enrollments: [{ id: 1 }] },
          { id: 3, slackChannelId: 'COLD', enrollments: [] },
        ]),
      },
    };
    slack = {
      enabled: true,
      inviteToChannel: jest.fn().mockResolvedValue(undefined),
      removeFromChannel: jest.fn().mockResolvedValue(undefined),
      listChannelMembers: jest.fn().mockResolvedValue([]),
    };
    service = new SlackChannelsService(
      prisma as unknown as PrismaService,
      slack as unknown as SlackService,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('adds the user where they are enrolled, and removes them elsewhere', async () => {
    service.syncInBackground(7, [4, 3]);
    await handed();

    expect(prisma.cohort.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [4, 3] }, slackChannelId: { not: null } },
      }),
    );
    expect(slack.inviteToChannel).toHaveBeenCalledWith('CNEW', 'U0ADA');
    expect(slack.removeFromChannel).toHaveBeenCalledWith('COLD', 'U0ADA');
  });

  it('skips empty and repeated cohort ids', async () => {
    service.syncInBackground(7, [4, null, undefined, 4]);
    await handed();

    expect(prisma.cohort.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [4] }, slackChannelId: { not: null } },
      }),
    );
  });

  it("does nothing for a user who hasn't joined Slack yet", async () => {
    prisma.user.findUnique.mockResolvedValue({ slackUserId: null });

    service.syncInBackground(7, [4]);
    await handed();

    expect(prisma.cohort.findMany).not.toHaveBeenCalled();
    expect(slack.inviteToChannel).not.toHaveBeenCalled();
  });

  it.each([
    ['Slack is not set up', false, [4]],
    ['there is no cohort', true, [null]],
  ])('starts nothing when %s', (_, enabled, ids) => {
    slack.enabled = enabled;

    service.syncInBackground(7, ids);

    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('keeps going when one channel fails, and logs it', async () => {
    slack.inviteToChannel.mockRejectedValue(new Error('channel_not_found'));

    service.syncInBackground(7, [4, 3]);
    await handed();

    expect(slack.removeFromChannel).toHaveBeenCalledWith('COLD', 'U0ADA');
    expect(logError).toHaveBeenCalledWith(
      'Failed to add user 7 in Slack channel CNEW',
      expect.stringContaining('channel_not_found'),
    );
  });

  it('logs a failed lookup instead of throwing', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('db down'));

    service.syncInBackground(7, [4]);

    await expect(handed()).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(
      'Failed to sync the Slack channels of user 7',
      expect.stringContaining('db down'),
    );
  });

  describe('moving a cohort to another channel', () => {
    beforeEach(() => {
      (prisma as unknown as { enrollment: unknown }).enrollment = {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { user: { slackUserId: 'U0ADA' } },
            { user: { slackUserId: 'U0GRACE' } },
          ]),
      };
    });

    it("reads the cohort's linked students", async () => {
      await expect(service.linkedStudents(3)).resolves.toEqual([
        'U0ADA',
        'U0GRACE',
      ]);
    });

    it('reads nobody when Slack is not set up', async () => {
      slack.enabled = false;

      await expect(service.linkedStudents(3)).resolves.toEqual([]);
    });

    it('removes each student from the old channel and adds them to the new one', async () => {
      service.moveInBackground(['U0ADA', 'U0GRACE'], 'COLD', 'CNEW');
      await handed();

      expect(slack.removeFromChannel.mock.calls).toEqual([
        ['COLD', 'U0ADA'],
        ['COLD', 'U0GRACE'],
      ]);
      expect(slack.inviteToChannel.mock.calls).toEqual([
        ['CNEW', 'U0ADA'],
        ['CNEW', 'U0GRACE'],
      ]);
    });

    it('only removes when there is no new channel', async () => {
      service.moveInBackground(['U0ADA'], 'COLD', null);
      await handed();

      expect(slack.removeFromChannel).toHaveBeenCalledWith('COLD', 'U0ADA');
      expect(slack.inviteToChannel).not.toHaveBeenCalled();
    });

    it('keeps going when one call fails', async () => {
      slack.removeFromChannel.mockRejectedValueOnce(
        new Error('not_in_channel'),
      );

      service.moveInBackground(['U0ADA', 'U0GRACE'], 'COLD', 'CNEW');
      await handed();

      expect(slack.inviteToChannel).toHaveBeenCalledTimes(2);
      expect(slack.removeFromChannel).toHaveBeenCalledTimes(2);
      expect(logError).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['nobody to move', [], 'COLD', 'CNEW'],
      ['the same channel', ['U0ADA'], 'COLD', 'COLD'],
    ])('does nothing for %s', (_, ids, from, to) => {
      service.moveInBackground(ids, from, to);

      expect(waitUntil).not.toHaveBeenCalled();
    });
  });

  describe('reconcileAll (nightly check)', () => {
    beforeEach(() => {
      // Cohort 4's channel should hold Ada and Grace.
      prisma.cohort.findMany.mockResolvedValue([
        {
          id: 4,
          slackChannelId: 'CSPRING',
          enrollments: [
            { user: { slackUserId: 'U0ADA' } },
            { user: { slackUserId: 'U0GRACE' } },
          ],
        },
      ]);
      // Linked students: Ada and Grace are enrolled, Linus left the cohort.
      prisma.user.findMany.mockResolvedValue([
        { slackUserId: 'U0ADA' },
        { slackUserId: 'U0GRACE' },
        { slackUserId: 'U0LINUS' },
      ]);
      // In the channel: Ada, Linus, a mentor, the bot. Grace is missing.
      slack.listChannelMembers.mockResolvedValue([
        'U0ADA',
        'U0LINUS',
        'U0MENTOR',
        'U0BOT',
      ]);
    });

    it('adds enrolled students who are missing from the channel', async () => {
      const result = await service.reconcileAll();

      expect(slack.inviteToChannel).toHaveBeenCalledTimes(1);
      expect(slack.inviteToChannel).toHaveBeenCalledWith('CSPRING', 'U0GRACE');
      expect(result).toMatchObject({ channels: 1, added: 1 });
    });

    it('removes only linked students who left the cohort', async () => {
      const result = await service.reconcileAll();

      expect(slack.removeFromChannel).toHaveBeenCalledTimes(1);
      expect(slack.removeFromChannel).toHaveBeenCalledWith(
        'CSPRING',
        'U0LINUS',
      );
      // Never the mentor or the bot, which Forgeng doesn't count as students.
      expect(result).toMatchObject({ removed: 1 });
    });

    it('reads only enrolled students who are linked to Slack', async () => {
      await service.reconcileAll();

      expect(prisma.cohort.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slackChannelId: { not: null } },
        }),
      );
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'student', slackUserId: { not: null } },
        }),
      );
    });

    it('keeps checking other channels when one fails', async () => {
      prisma.cohort.findMany.mockResolvedValue([
        { id: 3, slackChannelId: 'CBROKEN', enrollments: [] },
        {
          id: 4,
          slackChannelId: 'CSPRING',
          enrollments: [{ user: { slackUserId: 'U0GRACE' } }],
        },
      ]);
      slack.listChannelMembers
        .mockRejectedValueOnce(new Error('channel_not_found'))
        .mockResolvedValueOnce([]);

      const result = await service.reconcileAll();

      expect(slack.inviteToChannel).toHaveBeenCalledWith('CSPRING', 'U0GRACE');
      expect(result.channels).toBe(1);
      expect(logError).toHaveBeenCalledWith(
        'Failed to check Slack channel CBROKEN of cohort 3',
        expect.stringContaining('channel_not_found'),
      );
    });

    it('keeps checking the channel when Slack refuses one member', async () => {
      // A deactivated account can't be invited, every night.
      prisma.cohort.findMany.mockResolvedValue([
        {
          id: 4,
          slackChannelId: 'CSPRING',
          enrollments: [
            { user: { slackUserId: 'U0GONE' } },
            { user: { slackUserId: 'U0ADA' } },
            { user: { slackUserId: 'U0GRACE' } },
          ],
        },
      ]);
      slack.inviteToChannel.mockRejectedValueOnce(new Error('user_disabled'));

      const result = await service.reconcileAll();

      // Grace is still added, and Linus is still removed.
      expect(slack.inviteToChannel).toHaveBeenCalledWith('CSPRING', 'U0GRACE');
      expect(slack.removeFromChannel).toHaveBeenCalledWith(
        'CSPRING',
        'U0LINUS',
      );
      // Only the calls that worked are counted.
      expect(result).toEqual({ channels: 1, added: 1, removed: 1 });
      expect(logError).toHaveBeenCalledWith(
        'Failed to add Slack member U0GONE to channel CSPRING',
        expect.stringContaining('user_disabled'),
      );
    });

    it('does nothing when Slack is not set up', async () => {
      slack.enabled = false;

      await expect(service.reconcileAll()).resolves.toEqual({
        channels: 0,
        added: 0,
        removed: 0,
      });
      expect(prisma.cohort.findMany).not.toHaveBeenCalled();
    });
  });
});
