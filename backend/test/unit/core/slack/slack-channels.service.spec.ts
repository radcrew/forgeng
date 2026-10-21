import { Logger } from '@nestjs/common';
import { waitUntil } from '@vercel/functions';
import { Prisma } from '@prisma/client';
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
    user: { findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock };
    cohort: { findMany: jest.Mock; updateMany: jest.Mock };
  };
  let slack: {
    enabled: boolean;
    inviteToChannel: jest.Mock;
    removeFromChannel: jest.Mock;
    listChannelMembers: jest.Mock;
    createPrivateChannel: jest.Mock;
    findUserIdByEmail: jest.Mock;
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
        update: jest.fn().mockResolvedValue({}),
      },
      cohort: {
        findMany: jest.fn().mockResolvedValue([
          // Still enrolled in the new cohort, no longer in the old one.
          { id: 4, slackChannelId: 'CNEW', enrollments: [{ id: 1 }] },
          { id: 3, slackChannelId: 'COLD', enrollments: [] },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    slack = {
      enabled: true,
      inviteToChannel: jest.fn().mockResolvedValue(undefined),
      removeFromChannel: jest.fn().mockResolvedValue(undefined),
      listChannelMembers: jest.fn().mockResolvedValue([]),
      createPrivateChannel: jest.fn().mockResolvedValue('CGOLANG'),
      findUserIdByEmail: jest.fn().mockResolvedValue(null),
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

  it('never removes an admin who leaves a cohort', async () => {
    prisma.user.findUnique.mockResolvedValue({
      slackUserId: 'U0MENTOR',
      role: 'admin',
    });

    service.syncInBackground(9, [4, 3]);
    await handed();

    // The admin stays in both channels, also the one they left.
    expect(slack.removeFromChannel).not.toHaveBeenCalled();
    expect(slack.inviteToChannel).toHaveBeenCalledWith('COLD', 'U0MENTOR');
  });

  it('checks every cohort channel after a change to or from admin', async () => {
    // A former admin, now a student enrolled only in the new cohort.
    prisma.user.findUnique.mockResolvedValue({
      slackUserId: 'U0ADA',
      role: 'student',
    });

    service.syncAllInBackground(7);
    await handed();

    expect(prisma.cohort.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slackChannelId: { not: null } } }),
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

  describe('createForCohortInBackground', () => {
    it('creates the channel after the response, and saves it on the cohort', async () => {
      service.createForCohortInBackground({ id: 7, name: 'Golang' }, 9);
      await handed();

      expect(slack.createPrivateChannel).toHaveBeenCalled();
      // Only while the cohort still has no channel.
      expect(prisma.cohort.updateMany).toHaveBeenCalledWith({
        where: { id: 7, slackChannelId: null },
        data: { slackChannelId: 'CGOLANG' },
      });
    });

    it('saves nothing when Slack refused the channel', async () => {
      slack.createPrivateChannel.mockRejectedValue(new Error('restricted'));

      service.createForCohortInBackground({ id: 7, name: 'Golang' }, 9);
      await handed();

      expect(prisma.cohort.updateMany).not.toHaveBeenCalled();
    });

    it('logs a failed save instead of throwing', async () => {
      prisma.cohort.updateMany.mockRejectedValue(new Error('db down'));

      service.createForCohortInBackground({ id: 7, name: 'Golang' }, 9);

      await expect(handed()).resolves.toBeUndefined();
      expect(logError).toHaveBeenCalledWith(
        'Failed to save the Slack channel of cohort 7',
        expect.stringContaining('db down'),
      );
    });

    it('starts nothing when Slack is not set up', () => {
      slack.enabled = false;

      service.createForCohortInBackground({ id: 7, name: 'Golang' }, 9);

      expect(waitUntil).not.toHaveBeenCalled();
    });
  });

  describe('createForCohort', () => {
    const create = (name = 'Golang Autumn') =>
      service.createForCohort({ id: 7, name }, 9);

    it('creates a channel named after the cohort, then a numbered one', async () => {
      await expect(create()).resolves.toBe('CGOLANG');

      expect(slack.createPrivateChannel).toHaveBeenCalledWith([
        'golang-autumn',
        'golang-autumn-7',
      ]);
    });

    it('uses "cohort-7" for a name with nothing usable', async () => {
      await create('日本語');

      expect(slack.createPrivateChannel).toHaveBeenCalledWith(['cohort-7']);
    });

    it('keeps the numbered name within 80 characters', async () => {
      await create('a'.repeat(100));

      const [names] = slack.createPrivateChannel.mock.calls[0] as [string[]];
      expect(names[1]).toBe(`${'a'.repeat(78)}-7`);
    });

    const ADMINS = [
      { id: 9, email: 'grace@example.com', slackUserId: 'U0GRACE' },
      { id: 10, email: 'linus@example.com', slackUserId: 'U0LINUS' },
      { id: 11, email: 'no-slack@example.com', slackUserId: null },
    ];

    it('invites every linked admin', async () => {
      prisma.user.findMany.mockResolvedValue(ADMINS);

      await create();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'admin' } }),
      );
      expect(slack.inviteToChannel.mock.calls).toEqual([
        ['CGOLANG', 'U0GRACE'],
        ['CGOLANG', 'U0LINUS'],
      ]);
      expect(slack.findUserIdByEmail).not.toHaveBeenCalled();
    });

    it('links the creating admin by email when they are not linked yet', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 9, email: 'grace@example.com', slackUserId: null },
      ]);
      slack.findUserIdByEmail.mockResolvedValue('U0GRACE');

      await create();

      expect(slack.findUserIdByEmail).toHaveBeenCalledWith('grace@example.com');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: { slackUserId: 'U0GRACE' },
      });
      expect(slack.inviteToChannel).toHaveBeenCalledWith('CGOLANG', 'U0GRACE');
    });

    it('invites nobody new when the creator is not in Slack', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 9, email: 'grace@example.com', slackUserId: null },
      ]);
      slack.findUserIdByEmail.mockResolvedValue(null);

      await expect(create()).resolves.toBe('CGOLANG');

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(slack.inviteToChannel).not.toHaveBeenCalled();
    });

    it("doesn't link a Slack account that belongs to another user", async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 9, email: 'grace@example.com', slackUserId: null },
      ]);
      slack.findUserIdByEmail.mockResolvedValue('U0TAKEN');
      prisma.user.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('taken', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(create()).resolves.toBe('CGOLANG');

      expect(slack.inviteToChannel).not.toHaveBeenCalled();
    });

    it('still returns the channel when an invite or the admin lookup fails', async () => {
      prisma.user.findMany.mockResolvedValue(ADMINS);
      slack.inviteToChannel.mockRejectedValueOnce(new Error('cant_invite'));

      await expect(create()).resolves.toBe('CGOLANG');
      // The second admin is still invited.
      expect(slack.inviteToChannel).toHaveBeenCalledTimes(2);

      prisma.user.findMany.mockRejectedValue(new Error('db down'));
      await expect(create()).resolves.toBe('CGOLANG');
      expect(logError).toHaveBeenCalledWith(
        'Failed to find the admins to add to a new Slack channel',
        expect.stringContaining('db down'),
      );
    });

    it('returns null and logs when Slack refuses', async () => {
      slack.createPrivateChannel.mockRejectedValue(new Error('missing_scope'));

      await expect(create()).resolves.toBeNull();
      expect(logError).toHaveBeenCalledWith(
        'Failed to create a Slack channel for cohort 7',
        expect.stringContaining('missing_scope'),
      );
    });

    it('does nothing when Slack is not set up', async () => {
      slack.enabled = false;

      await expect(create()).resolves.toBeNull();
      expect(slack.createPrivateChannel).not.toHaveBeenCalled();
    });
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
      // Linked: Ada and Grace are enrolled, Linus left the cohort.
      prisma.user.findMany.mockResolvedValue([
        { role: 'student', slackUserId: 'U0ADA' },
        { role: 'student', slackUserId: 'U0GRACE' },
        { role: 'student', slackUserId: 'U0LINUS' },
        // A linked admin, already in the channel.
        { role: 'admin', slackUserId: 'U0MENTOR' },
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
      // Every role, so someone who is no longer a student is found too.
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slackUserId: { not: null } } }),
      );
    });

    it('removes a linked person who is no longer a student', async () => {
      // Linus became an applicant again, and his removal failed then.
      prisma.user.findMany.mockResolvedValue([
        { role: 'student', slackUserId: 'U0ADA' },
        { role: 'student', slackUserId: 'U0GRACE' },
        { role: 'applicant', slackUserId: 'U0LINUS' },
        { role: 'admin', slackUserId: 'U0MENTOR' },
      ]);

      await service.reconcileAll();

      expect(slack.removeFromChannel).toHaveBeenCalledTimes(1);
      expect(slack.removeFromChannel).toHaveBeenCalledWith(
        'CSPRING',
        'U0LINUS',
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

    it('adds a linked admin who is missing, and never removes admins', async () => {
      prisma.user.findMany.mockResolvedValue([
        { role: 'student', slackUserId: 'U0ADA' },
        { role: 'student', slackUserId: 'U0GRACE' },
        { role: 'admin', slackUserId: 'U0MENTOR' },
        { role: 'admin', slackUserId: 'U0NEWMENTOR' },
      ]);

      const result = await service.reconcileAll();

      expect(slack.inviteToChannel).toHaveBeenCalledWith(
        'CSPRING',
        'U0NEWMENTOR',
      );
      // Grace, the missing student, and the missing admin.
      expect(result.added).toBe(2);
      expect(slack.removeFromChannel).not.toHaveBeenCalledWith(
        'CSPRING',
        'U0MENTOR',
      );
    });
  });

  describe('addAdminToAllChannels', () => {
    beforeEach(() => {
      prisma.cohort.findMany.mockResolvedValue([
        { slackChannelId: 'CSPRING' },
        { slackChannelId: 'CAUTUMN' },
      ]);
    });

    it('adds the admin to every cohort channel', async () => {
      await service.addAdminToAllChannels('U0MENTOR');

      expect(prisma.cohort.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slackChannelId: { not: null } } }),
      );
      expect(slack.inviteToChannel.mock.calls).toEqual([
        ['CSPRING', 'U0MENTOR'],
        ['CAUTUMN', 'U0MENTOR'],
      ]);
    });

    it('keeps going when one channel fails', async () => {
      slack.inviteToChannel.mockRejectedValueOnce(
        new Error('channel_not_found'),
      );

      await service.addAdminToAllChannels('U0MENTOR');

      expect(slack.inviteToChannel).toHaveBeenCalledTimes(2);
      expect(logError).toHaveBeenCalledTimes(1);
    });

    it('never throws when the cohorts cannot be read', async () => {
      prisma.cohort.findMany.mockRejectedValue(new Error('db down'));

      await expect(
        service.addAdminToAllChannels('U0MENTOR'),
      ).resolves.toBeUndefined();
      expect(slack.inviteToChannel).not.toHaveBeenCalled();
    });

    it('does nothing when Slack is not set up', async () => {
      slack.enabled = false;

      await service.addAdminToAllChannels('U0MENTOR');

      expect(prisma.cohort.findMany).not.toHaveBeenCalled();
    });
  });
});
