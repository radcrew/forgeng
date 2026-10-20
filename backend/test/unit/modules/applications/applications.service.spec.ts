import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type User } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { MailService } from '@core/mail';
import { SlackChannelsService } from '@core/slack';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { ApplicationsService } from '@modules/applications/applications.service';
import { VideoService } from '@modules/applications/video.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    clerkId: null,
    email: 'ada@example.com',
    emailVerified: true,
    name: 'Ada Lovelace',
    role: 'applicant',
    bio: null,
    githubUrl: null,
    avatarUrl: null,
    registrationIp: null,
    registrationCountry: null,
    registrationCity: null,
    createdAt: DATE,
    ...overrides,
  } as User;
}

type ApplicationRow = {
  id: number;
  userId: number | null;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  motivation: string | null;
  background: string | null;
  experience: string | null;
  linkedin: string | null;
  twitter: string | null;
  facebook: string | null;
  github: string | null;
  portfolio: string | null;
  telegram: string | null;
  whatsapp: string | null;
  country: string | null;
  videoUrl: string | null;
  wallets: unknown;
  reviewerNote: string | null;
  cohortId: number | null;
  createdAt: Date;
};

function makeApplicationRow(
  overrides: Partial<ApplicationRow> = {},
): ApplicationRow {
  return {
    id: 10,
    userId: 1,
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    status: 'pending',
    motivation: 'I want to learn',
    background: null,
    experience: null,
    linkedin: null,
    twitter: null,
    facebook: null,
    github: null,
    portfolio: null,
    telegram: null,
    whatsapp: null,
    country: null,
    videoUrl: null,
    wallets: [],
    reviewerNote: 'internal note',
    cohortId: null,
    createdAt: DATE,
    ...overrides,
  };
}

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: {
    application: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      groupBy: jest.Mock;
    };
    user: { update: jest.Mock };
    // Read after the decision is saved, for the acceptance email.
    cohort: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    application: { update: jest.Mock };
    user: { updateMany: jest.Mock };
    enrollment: {
      upsert: jest.Mock;
      findUnique: jest.Mock;
      deleteMany: jest.Mock;
    };
    cohort: { findUnique: jest.Mock };
  };
  let notifications: { notifyApplicationReceived: jest.Mock };
  let mail: { sendInBackground: jest.Mock };
  let video: { assertOwnUpload: jest.Mock; viewUrl: jest.Mock };
  let slackChannels: { syncInBackground: jest.Mock };

  beforeEach(() => {
    prisma = {
      application: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        groupBy: jest.fn(),
      },
      user: { update: jest.fn() },
      cohort: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    tx = {
      application: { update: jest.fn() },
      user: { updateMany: jest.fn() },
      enrollment: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn(),
      },
      cohort: { findUnique: jest.fn() },
    };
    notifications = {
      notifyApplicationReceived: jest.fn().mockResolvedValue(undefined),
    };
    mail = { sendInBackground: jest.fn() };
    video = {
      assertOwnUpload: jest.fn().mockResolvedValue(undefined),
      viewUrl: jest.fn((url: string | null) => Promise.resolve(url)),
    };
    const config = {
      get: jest.fn().mockReturnValue('https://app.example.com'),
    };

    slackChannels = { syncInBackground: jest.fn() };

    service = new ApplicationsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      mail as unknown as MailService,
      config as unknown as ConfigService<never, true>,
      video as unknown as VideoService,
      slackChannels as unknown as SlackChannelsService,
    );
  });

  describe('list', () => {
    it('paginates with defaults and maps rows to DTOs', async () => {
      prisma.application.findMany.mockResolvedValue([makeApplicationRow()]);
      prisma.application.count.mockResolvedValue(1);

      const result = await service.list({});

      expect(result.page).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(10);
      // No status filter means an undefined where clause.
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('filters by status when provided', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      prisma.application.count.mockResolvedValue(0);

      await service.list({ status: 'accepted' } as never);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'accepted' } }),
      );
    });
  });

  describe('create', () => {
    it('rejects a duplicate application with a ConflictException', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());

      await expect(
        service.create(makeUser(), { motivation: 'hi' } as never),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.application.create).not.toHaveBeenCalled();
    });

    it('creates an application and notifies admins', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      prisma.application.create.mockResolvedValue(makeApplicationRow());

      const dto = await service.create(makeUser(), {
        motivation: 'hi',
        telegram: '@ada_dev',
      } as never);

      expect(dto.id).toBe(10);
      expect(notifications.notifyApplicationReceived).toHaveBeenCalledTimes(1);
      // Nothing was saved on the profile, so the user isn't touched.
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('moves links and a wallet saved on the profile into the application', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      prisma.application.create.mockResolvedValue(makeApplicationRow());
      const user = makeUser({
        profileLinks: {
          github: 'https://github.com/ada',
          telegram: '@saved_handle',
        },
        wallets: [{ chain: 'evm', address: '0xabc' }],
      });

      // The form sends its own Telegram handle and no wallet.
      await service.create(user, { telegram: '@ada_dev' } as never);

      const { data } = (
        prisma.application.create.mock.calls[0] as [
          { data: Record<string, unknown> },
        ]
      )[0];
      expect(data.github).toBe('https://github.com/ada');
      expect(data.telegram).toBe('@ada_dev');
      expect(data.wallets).toEqual([{ chain: 'evm', address: '0xabc' }]);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { profileLinks: Prisma.DbNull, wallets: Prisma.DbNull },
      });
    });

    it('keeps the wallet from the form over the one saved on the profile', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      prisma.application.create.mockResolvedValue(makeApplicationRow());
      const user = makeUser({ wallets: [{ chain: 'evm', address: '0xold' }] });

      await service.create(user, {
        telegram: '@ada_dev',
        wallets: [{ chain: 'tron', address: 'Tnew' }],
      } as never);

      const { data } = (
        prisma.application.create.mock.calls[0] as [
          { data: { wallets: unknown } },
        ]
      )[0];
      expect(data.wallets).toEqual([{ chain: 'tron', address: 'Tnew' }]);
    });

    it('requires a Telegram or WhatsApp contact', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(
        service.create(makeUser(), { videoUrl: '2/abc.webm' } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.application.create).not.toHaveBeenCalled();
    });

    it('does not create the application when the video check fails', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      video.assertOwnUpload.mockRejectedValue(new BadRequestException());

      await expect(
        service.create(makeUser(), {
          videoUrl: '2/abc.webm',
          whatsapp: '+15551234567',
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(video.assertOwnUpload).toHaveBeenCalledWith(1, '2/abc.webm');
      expect(prisma.application.create).not.toHaveBeenCalled();
    });

    it('still creates the application when the admin notification fails', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      prisma.application.create.mockResolvedValue(makeApplicationRow());
      notifications.notifyApplicationReceived.mockRejectedValue(
        new Error('smtp down'),
      );
      // The failure is logged best-effort; silence it to keep test output clean.
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      const dto = await service.create(makeUser(), {
        motivation: 'hi',
        telegram: '@ada_dev',
      } as never);

      expect(dto.id).toBe(10);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('findMine', () => {
    it('returns null when the user has no application', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      await expect(service.findMine(1)).resolves.toBeNull();
    });

    it('strips the internal reviewerNote from the applicant view', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
      const dto = await service.findMine(1);
      expect(dto).not.toBeNull();
      expect(dto?.reviewerNote).toBeNull();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the application is missing', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the application DTO including the reviewer note', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
      const dto = await service.findOne(10);
      expect(dto.reviewerNote).toBe('internal note');
    });

    it('replaces the stored video path with a playable link', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
      video.viewUrl.mockResolvedValue('https://signed.example/v.webm');

      const dto = await service.findOne(10);

      expect(dto.videoUrl).toBe('https://signed.example/v.webm');
    });
  });

  describe('updateStatus', () => {
    it.each(['accepted', 'rejected'])(
      'refuses to change the status of a %s application',
      async (decided) => {
        prisma.application.findUnique.mockResolvedValue(
          makeApplicationRow({ status: decided }),
        );

        await expect(
          service.updateStatus(10, { status: 'pending' }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(tx.application.update).not.toHaveBeenCalled();
        expect(mail.sendInBackground).not.toHaveBeenCalled();
      },
    );

    it('lets the note change on a decided application without emailing again', async () => {
      prisma.application.findUnique.mockResolvedValue(
        makeApplicationRow({ status: 'rejected' }),
      );
      tx.application.update.mockResolvedValue(
        makeApplicationRow({ status: 'rejected', reviewerNote: 'new note' }),
      );

      const dto = await service.updateStatus(10, {
        status: 'rejected',
        reviewerNote: 'new note',
      });

      expect(dto.status).toBe('rejected');
      expect(mail.sendInBackground).not.toHaveBeenCalled();
    });

    it('decides a pending application and emails the applicant', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
      tx.application.update.mockResolvedValue(
        makeApplicationRow({ status: 'rejected' }),
      );

      await service.updateStatus(10, { status: 'rejected' });

      expect(mail.sendInBackground).toHaveBeenCalledTimes(1);
    });

    it.each(['accepted', 'rejected'] as const)(
      'emails the applicant in the background when %s',
      async (status) => {
        prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
        tx.application.update.mockResolvedValue(makeApplicationRow({ status }));

        const dto = await service.updateStatus(10, { status });

        // So the decision doesn't wait for the mail server or fail with it.
        expect(dto.status).toBe(status);
        expect(mail.sendInBackground).toHaveBeenCalledWith(
          expect.objectContaining({ to: 'ada@example.com' }),
        );
      },
    );

    it('names the cohort in the acceptance email', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
      tx.application.update.mockResolvedValue(
        makeApplicationRow({ status: 'accepted', cohortId: 5 }),
      );
      tx.enrollment.findUnique.mockResolvedValue({ userId: 1 });
      prisma.cohort.findUnique.mockResolvedValue({ name: 'Autumn' });

      await service.updateStatus(10, { status: 'accepted', cohortId: 5 });

      expect(mail.sendInBackground).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(
            'You have been added to the Autumn cohort.',
          ) as unknown,
        }),
      );
    });

    it('still sends the acceptance email when the cohort lookup fails', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
      tx.application.update.mockResolvedValue(
        makeApplicationRow({ status: 'accepted', cohortId: 5 }),
      );
      tx.enrollment.findUnique.mockResolvedValue({ userId: 1 });
      prisma.cohort.findUnique.mockRejectedValue(new Error('db down'));
      const logError = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      const dto = await service.updateStatus(10, {
        status: 'accepted',
        cohortId: 5,
      });

      // The decision is saved, and the email goes out without the name.
      expect(dto.status).toBe('accepted');
      expect(mail.sendInBackground).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ada@example.com' }),
      );
      expect(logError).toHaveBeenCalledWith(
        'Failed to look up the cohort for the acceptance email to ada@example.com',
        expect.any(String),
      );
    });

    it('accepting makes the applicant a student and enrolls them', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
      tx.application.update.mockResolvedValue(
        makeApplicationRow({ status: 'accepted', cohortId: 5 }),
      );
      tx.enrollment.findUnique.mockResolvedValue(null);
      tx.cohort.findUnique.mockResolvedValue({
        id: 5,
        name: 'Autumn',
        capacity: 10,
        _count: { enrollments: 0 },
      });

      await service.updateStatus(10, { status: 'accepted', cohortId: 5 });

      expect(tx.user.updateMany).toHaveBeenCalledWith({
        where: { id: 1, role: 'applicant' },
        data: { role: 'student' },
      });
      expect(tx.enrollment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: { userId: 1, cohortId: 5 } }),
      );
      // Adds the new student to the cohort's Slack channel.
      expect(slackChannels.syncInBackground).toHaveBeenCalledWith(1, [5, null]);
    });

    it('touches no Slack channel for a rejected application', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
      tx.application.update.mockResolvedValue(
        makeApplicationRow({ status: 'rejected' }),
      );

      await service.updateStatus(10, { status: 'rejected' });

      expect(slackChannels.syncInBackground).not.toHaveBeenCalled();
    });

    it('moves an accepted student to the new cohort', async () => {
      prisma.application.findUnique.mockResolvedValue(
        makeApplicationRow({ status: 'accepted', cohortId: 3 }),
      );
      tx.application.update.mockResolvedValue(
        makeApplicationRow({ status: 'accepted', cohortId: 4 }),
      );
      tx.enrollment.findUnique.mockResolvedValue(null);
      tx.cohort.findUnique.mockResolvedValue({
        id: 4,
        name: 'Autumn',
        capacity: 10,
        _count: { enrollments: 0 },
      });

      await service.updateStatus(10, { status: 'accepted', cohortId: 4 });

      expect(tx.enrollment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: { userId: 1, cohortId: 4 } }),
      );
      expect(tx.enrollment.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1, cohortId: 3 },
      });
      // Both channels: into the new cohort's, out of the old one's.
      expect(slackChannels.syncInBackground).toHaveBeenCalledWith(1, [4, 3]);
    });

    it('removes the student from the cohort when it is cleared', async () => {
      prisma.application.findUnique.mockResolvedValue(
        makeApplicationRow({ status: 'accepted', cohortId: 3 }),
      );
      tx.application.update.mockResolvedValue(
        makeApplicationRow({ status: 'accepted', cohortId: null }),
      );

      await service.updateStatus(10, {
        status: 'accepted',
        cohortId: null as unknown as number,
      });

      expect(tx.enrollment.upsert).not.toHaveBeenCalled();
      expect(tx.enrollment.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1, cohortId: 3 },
      });
    });

    it('keeps the enrollment when only the note changes', async () => {
      prisma.application.findUnique.mockResolvedValue(
        makeApplicationRow({ status: 'accepted', cohortId: 3 }),
      );
      tx.application.update.mockResolvedValue(
        makeApplicationRow({ status: 'accepted', cohortId: 3 }),
      );
      tx.enrollment.findUnique.mockResolvedValue({ id: 1 });

      await service.updateStatus(10, {
        status: 'accepted',
        reviewerNote: 'ok',
      });

      expect(tx.enrollment.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('stats', () => {
    it('aggregates groupBy rows into per-status counts and a total', async () => {
      prisma.application.groupBy.mockResolvedValue([
        { status: 'pending', _count: { _all: 3 } },
        { status: 'accepted', _count: { _all: 2 } },
        { status: 'rejected', _count: { _all: 1 } },
      ]);

      await expect(service.stats()).resolves.toEqual({
        pending: 3,
        accepted: 2,
        rejected: 1,
        total: 6,
      });
    });

    it('returns all-zero counts when there are no applications', async () => {
      prisma.application.groupBy.mockResolvedValue([]);
      await expect(service.stats()).resolves.toEqual({
        pending: 0,
        accepted: 0,
        rejected: 0,
        total: 0,
      });
    });
  });
});
