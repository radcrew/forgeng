import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Payment, User } from '@prisma/client';
import { MailService } from '@core/mail';
import { SlackChannelsService } from '@core/slack';
import { PrismaService } from '@core/database/prisma.service';
import { UsersService } from '@modules/users/users.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    role: 'student',
    createdAt: DATE,
    ...overrides,
  } as User;
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 100,
    userId: 1,
    amount: { toString: () => '250' },
    currency: 'USDC',
    txLink: null,
    note: null,
    forMonth: '2026-01',
    paidAt: DATE,
    ...overrides,
  } as unknown as Payment;
}

/** The UTC month `ago` months before now, as "YYYY-MM" (negative is ahead). */
function monthsAgo(ago: number): string {
  const now = new Date();
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - ago, 1),
  );
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    application: { findUnique: jest.Mock; updateMany: jest.Mock };
    enrollment: { deleteMany: jest.Mock; findMany: jest.Mock };
    payment: { create: jest.Mock; findMany: jest.Mock };
    task: { findMany: jest.Mock };
    submission: { findMany: jest.Mock };
    notification: { findFirst: jest.Mock };
    refreshToken: { updateMany: jest.Mock };
    $queryRaw: jest.Mock;
    $transaction: jest.Mock;
  };
  let mail: { send: jest.Mock; sendInBackground: jest.Mock };
  let slackChannels: { syncInBackground: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      application: {
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn(),
      },
      enrollment: {
        deleteMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      payment: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      task: { findMany: jest.fn().mockResolvedValue([]) },
      submission: { findMany: jest.fn().mockResolvedValue([]) },
      notification: { findFirst: jest.fn().mockResolvedValue(null) },
      refreshToken: { updateMany: jest.fn() },
      // The locked list of admin rows used by the "keep one admin" check.
      $queryRaw: jest.fn().mockResolvedValue([]),
      // The service passes a function that runs on the transaction client.
      // Here that client is this same fake.
      $transaction: jest.fn((fn: (client: unknown) => Promise<unknown>) =>
        fn(prisma),
      ),
    };
    mail = {
      send: jest.fn().mockResolvedValue(undefined),
      sendInBackground: jest.fn(),
    };
    const config = {
      get: jest.fn().mockReturnValue('https://app.forgeng.test'),
    };

    slackChannels = { syncInBackground: jest.fn() };

    service = new UsersService(
      prisma as unknown as PrismaService,
      mail as unknown as MailService,
      config as unknown as ConfigService,
      slackChannels as unknown as SlackChannelsService,
    );
  });

  describe('getById', () => {
    it('throws NotFoundException when the user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getById(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the mapped user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      const dto = await service.getById(1);
      expect(dto.id).toBe(1);
    });

    it('includes social profile fields from the application record', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.application.findUnique.mockResolvedValue({
        linkedin: 'https://linkedin.com/in/ada',
        twitter: 'https://x.com/ada',
        facebook: 'https://facebook.com/ada',
        github: 'https://github.com/ada',
        portfolio: 'https://ada.dev',
        telegram: '@ada',
        whatsapp: '+14155552671',
      });

      const dto = await service.getById(1);

      expect(dto.linkedin).toBe('https://linkedin.com/in/ada');
      expect(dto.twitter).toBe('https://x.com/ada');
      expect(dto.facebook).toBe('https://facebook.com/ada');
      expect(dto.github).toBe('https://github.com/ada');
      expect(dto.portfolio).toBe('https://ada.dev');
      expect(dto.telegram).toBe('@ada');
      expect(dto.whatsapp).toBe('+14155552671');
      expect(prisma.application.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1 } }),
      );
    });

    it('defaults social fields to null when no application exists', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.application.findUnique.mockResolvedValue(null);

      const dto = await service.getById(1);

      expect(dto.linkedin).toBeNull();
      expect(dto.whatsapp).toBeNull();
    });
  });

  describe('recordPayment', () => {
    it('throws NotFoundException when the user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.recordPayment(1, { amount: '250', currency: 'USDC' } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates a payment and emails the student', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.payment.create.mockResolvedValue(makePayment());

      const dto = await service.recordPayment(1, {
        amount: '250',
        currency: 'USDC',
      } as never);

      expect(dto.amount).toBe('250');
      // In the background, so a slow or failed email can't hold up or fail
      // the saved payment.
      expect(mail.sendInBackground).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ada@example.com' }),
      );
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('saves the stipend month the admin picked', async () => {
      const picked = monthsAgo(2);
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.payment.create.mockResolvedValue(
        makePayment({ forMonth: picked }),
      );

      const dto = await service.recordPayment(1, {
        amount: 250,
        currency: 'USDT',
        forMonth: picked,
      });

      const data = (
        prisma.payment.create.mock.calls[0] as [{ data: { forMonth: string } }]
      )[0].data;
      expect(data.forMonth).toBe(picked);
      expect(dto.forMonth).toBe(picked);
    });

    it('accepts the oldest month the payment chart shows', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.payment.create.mockResolvedValue(makePayment());

      await service.recordPayment(1, {
        amount: 250,
        currency: 'USDT',
        forMonth: monthsAgo(5),
      });

      expect(prisma.payment.create).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['next month', -1],
      ['a month older than the chart', 6],
    ])(
      'refuses %s, which the payment chart would never show',
      async (_, ago) => {
        prisma.user.findUnique.mockResolvedValue(makeUser());

        await expect(
          service.recordPayment(1, {
            amount: 250,
            currency: 'USDT',
            forMonth: monthsAgo(ago),
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.payment.create).not.toHaveBeenCalled();
        expect(mail.sendInBackground).not.toHaveBeenCalled();
      },
    );

    it('uses the current month when none is given', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.payment.create.mockResolvedValue(makePayment());

      await service.recordPayment(1, {
        amount: 250,
        currency: 'USDT',
      });

      const data = (
        prisma.payment.create.mock.calls[0] as [{ data: { forMonth: string } }]
      )[0].data;
      expect(data.forMonth).toMatch(/^\d{4}-\d{2}$/);
    });

    it('picks the default month in UTC, whatever the server time zone', async () => {
      // 02:00 UTC on 1 June is still 31 May in time zones behind UTC.
      jest.useFakeTimers({
        now: new Date('2026-06-01T02:00:00.000Z'),
        doNotFake: ['nextTick', 'setImmediate'],
      });
      try {
        prisma.user.findUnique.mockResolvedValue(makeUser());
        prisma.payment.create.mockResolvedValue(makePayment());

        await service.recordPayment(1, { amount: 250, currency: 'USDT' });

        const data = (
          prisma.payment.create.mock.calls[0] as [
            { data: { forMonth: string } },
          ]
        )[0].data;
        expect(data.forMonth).toBe('2026-06');
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('list', () => {
    it('paginates and reports total with defaults', async () => {
      prisma.user.findMany.mockResolvedValue([makeUser(), makeUser({ id: 2 })]);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.list({});

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.items).toHaveLength(2);
    });

    it('filters by role when provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.list({ role: 'admin' } as never);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'admin' } }),
      );
    });

    it('searches names and emails, ignoring case, within the role', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.list({ role: 'student', search: 'ada' } as never);

      const where = {
        role: 'student',
        OR: [
          { name: { contains: 'ada', mode: 'insensitive' } },
          { email: { contains: 'ada', mode: 'insensitive' } },
        ],
      };
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({ where });
    });
  });

  describe('updateRole', () => {
    it('throws NotFoundException when the user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateRole(1, { role: 'admin' } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the role of an existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.user.update.mockResolvedValue(makeUser({ role: 'admin' }));

      const dto = await service.updateRole(1, { role: 'admin' } as never);

      expect(dto.role).toBe('admin');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { role: 'admin' } }),
      );
    });

    it('signs the user out everywhere when the role changes', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ role: 'student' }));
      prisma.user.update.mockResolvedValue(makeUser({ role: 'applicant' }));

      await service.updateRole(1, { role: 'applicant' } as never);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, revokedAt: null },
        data: { revokedAt: expect.any(Date) as unknown },
      });
    });

    it('keeps the user signed in when the role stays the same', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ role: 'student' }));
      prisma.user.update.mockResolvedValue(makeUser({ role: 'student' }));

      await service.updateRole(1, { role: 'student' } as never);

      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('takes a student moved back to applicant out of their cohorts', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ role: 'student' }));
      prisma.user.update.mockResolvedValue(makeUser({ role: 'applicant' }));
      prisma.enrollment.findMany.mockResolvedValue([
        { cohortId: 3 },
        { cohortId: 4 },
      ]);

      await service.updateRole(1, { role: 'applicant' } as never);

      expect(prisma.enrollment.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      // Out of those cohorts' Slack channels too.
      expect(slackChannels.syncInBackground).toHaveBeenCalledWith(1, [3, 4]);
    });

    it('sets an accepted application back to pending for a new applicant', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ role: 'student' }));
      prisma.user.update.mockResolvedValue(makeUser({ role: 'applicant' }));

      await service.updateRole(1, { role: 'applicant' } as never);

      // Only an accepted application changes; a rejected one stays.
      expect(prisma.application.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, status: 'accepted' },
        data: { status: 'pending' },
      });
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('accepts a pending application when an applicant becomes a student', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ role: 'applicant' }));
      prisma.user.update.mockResolvedValue(makeUser({ role: 'student' }));

      await service.updateRole(1, { role: 'student' } as never);

      // Only a pending application changes; decided ones stay final.
      expect(prisma.application.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, status: 'pending' },
        data: { status: 'accepted' },
      });
      expect(prisma.enrollment.deleteMany).not.toHaveBeenCalled();
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('leaves cohorts and applications alone for other changes', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ role: 'student' }));
      prisma.user.update.mockResolvedValue(makeUser({ role: 'admin' }));

      await service.updateRole(1, { role: 'admin' } as never);

      expect(prisma.enrollment.deleteMany).not.toHaveBeenCalled();
      expect(prisma.application.updateMany).not.toHaveBeenCalled();
      // No cohort left, so no Slack channel changes.
      expect(slackChannels.syncInBackground).toHaveBeenCalledWith(1, []);
    });

    it('refuses to remove the role of the only admin', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ role: 'admin' }));
      prisma.$queryRaw.mockResolvedValue([{ id: 1 }]);

      await expect(
        service.updateRole(1, { role: 'student' } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('lets an admin lose the role when another admin remains', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ role: 'admin' }));
      prisma.$queryRaw.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      prisma.user.update.mockResolvedValue(makeUser({ role: 'student' }));

      const dto = await service.updateRole(1, { role: 'student' } as never);

      expect(dto.role).toBe('student');
    });

    it('locks the admin rows inside the same transaction as the change', async () => {
      // Without the lock, two admins removing each other at the same moment
      // would each still count two admins, and both changes would go through.
      prisma.user.findUnique.mockResolvedValue(makeUser({ role: 'admin' }));
      prisma.$queryRaw.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      prisma.user.update.mockResolvedValue(makeUser({ role: 'student' }));

      await service.updateRole(1, { role: 'student' } as never);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const sql = (prisma.$queryRaw.mock.calls[0] as [string[]])[0].join('');
      expect(sql).toMatch(/FOR UPDATE/);
      expect(prisma.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
        prisma.user.update.mock.invocationCallOrder[0],
      );
    });

    it('does not count admins when the role stays admin', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ role: 'admin' }));
      prisma.user.update.mockResolvedValue(makeUser({ role: 'admin' }));

      await service.updateRole(1, { role: 'admin' } as never);

      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('paymentStats', () => {
    it('lists every payment under the stipend month it is for', async () => {
      const thisMonth = monthsAgo(0);
      prisma.payment.findMany.mockImplementation(
        ({ where }: { where: { forMonth: string } }) =>
          Promise.resolve(
            where.forMonth === thisMonth
              ? [
                  makePayment({ id: 1, currency: 'USDT' }),
                  makePayment({ id: 2, currency: 'USD' }),
                ]
              : [],
          ),
      );

      const stats = await service.paymentStats(1);

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, forMonth: thisMonth },
        }),
      );
      const current = stats.monthlyStats.find((m) => m.month === thisMonth);
      // Both payments show, not only the latest one.
      expect(current?.payments.map((p) => p.currency)).toEqual(['USDT', 'USD']);
      expect(
        stats.monthlyStats
          .filter((m) => m.month !== thisMonth)
          .every((m) => m.payments.length === 0),
      ).toBe(true);
    });

    it('shows the wallet kept on the user when there is no application', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({
        wallets: [{ chain: 'evm', address: '0xabc' }],
      });
      prisma.payment.findMany.mockResolvedValue([]);

      const stats = await service.paymentStats(1);

      expect(stats.wallets).toEqual([{ chain: 'evm', address: '0xabc' }]);
    });
  });

  describe('notifyWalletMissing', () => {
    it('throws NotFoundException when the user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.notifyWalletMissing(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('emails the user and reports sent', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      const result = await service.notifyWalletMissing(1);

      expect(result).toEqual({ sent: true });
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ada@example.com' }),
      );
    });
  });
});
