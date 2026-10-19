import { Logger } from '@nestjs/common';
import { waitUntil } from '@vercel/functions';
import { createTransport } from 'nodemailer';
import { PrismaService } from '@core/database/prisma.service';
import { MailService } from '@core/mail';

const transport = { sendMail: jest.fn(), close: jest.fn() };
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => transport),
}));
jest.mock('@vercel/functions', () => ({ waitUntil: jest.fn() }));

const SMTP = { host: 'smtp.example.com', port: 587, secure: false };
const email = { to: 'ada@example.com', subject: 'Hi', text: 'Hello' };

const makeConfig = (smtp: unknown) =>
  ({
    get: () => smtp,
    getOrThrow: () => 'Forgeng <no-reply@example.com>',
  }) as never;

/** The promise the last background send handed to waitUntil. */
const handedToWaitUntil = () => {
  const calls = (waitUntil as jest.Mock).mock.calls as [Promise<void>][];
  return calls[calls.length - 1][0];
};

describe('MailService', () => {
  let prisma: {
    emailOutbox: {
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let service: MailService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    transport.sendMail.mockResolvedValue(undefined);
    prisma = {
      emailOutbox: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    service = new MailService(
      makeConfig(SMTP),
      prisma as unknown as PrismaService,
    );
  });

  it('reuses a few pooled connections with a rate limit', () => {
    // Publishing a task to a whole cohort must not open one connection per
    // student at the same moment.
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        pool: true,
        maxConnections: 3,
        rateDelta: 1000,
        rateLimit: 10,
      }),
    );
  });

  it('creates no transport when SMTP is not set', () => {
    (createTransport as jest.Mock).mockClear();
    new MailService(makeConfig(undefined), prisma as unknown as PrismaService);

    expect(createTransport).not.toHaveBeenCalled();
  });

  describe('sendInBackground', () => {
    it('returns at once and hands the send to waitUntil', () => {
      // A mail server that never answers.
      transport.sendMail.mockReturnValue(new Promise(() => undefined));

      service.sendInBackground(email);

      expect(waitUntil).toHaveBeenCalledWith(expect.any(Promise));
    });

    it('keeps the email in the outbox and marks it sent', async () => {
      service.sendInBackground(email);
      await handedToWaitUntil();

      expect(prisma.emailOutbox.create).toHaveBeenCalledWith({
        data: { ...email, html: undefined },
        select: { id: true },
      });
      expect(transport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ada@example.com', subject: 'Hi' }),
      );
      expect(prisma.emailOutbox.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'sent',
          sentAt: expect.any(Date) as unknown,
          attempts: { increment: 1 },
        },
      });
    });

    it('marks a failed send for a retry instead of throwing', async () => {
      transport.sendMail.mockRejectedValue(new Error('smtp down'));

      service.sendInBackground(email);
      await expect(handedToWaitUntil()).resolves.toBeUndefined();

      expect(prisma.emailOutbox.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'failed',
          attempts: { increment: 1 },
          lastError: 'smtp down',
        },
      });
    });

    it('still sends when the outbox row cannot be saved', async () => {
      prisma.emailOutbox.create.mockRejectedValue(new Error('db down'));

      service.sendInBackground(email);
      await handedToWaitUntil();

      expect(transport.sendMail).toHaveBeenCalledTimes(1);
      expect(prisma.emailOutbox.update).not.toHaveBeenCalled();
    });

    it('never marks a sent email as failed when recording fails', async () => {
      prisma.emailOutbox.update.mockRejectedValue(new Error('db down'));

      service.sendInBackground(email);
      await expect(handedToWaitUntil()).resolves.toBeUndefined();

      // One update, for "sent". Marking it failed would send it twice.
      expect(prisma.emailOutbox.update).toHaveBeenCalledTimes(1);
      expect(prisma.emailOutbox.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'sent' }) as unknown,
        }),
      );
    });
  });

  describe('retryFailed', () => {
    const row = (id: number) => ({
      id,
      to: `s${id}@example.com`,
      subject: 'Your stipend',
      text: 'On its way',
      html: null,
    });

    it('looks only at recent failed emails with tries left', async () => {
      await service.retryFailed();

      // Never "pending" ones: such an email may already have gone out, and
      // sending it again would send it twice.
      expect(prisma.emailOutbox.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'failed',
            attempts: { lt: 4 },
            createdAt: { gte: expect.any(Date) as unknown },
          },
        }),
      );
    });

    it('sends them again and reports how many went out', async () => {
      prisma.emailOutbox.findMany.mockResolvedValue([row(1), row(2)]);
      transport.sendMail
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('smtp down'));

      const result = await service.retryFailed();

      expect(result).toEqual({ retried: 2, sent: 1 });
      expect(transport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 's1@example.com' }),
      );
      expect(prisma.emailOutbox.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: expect.objectContaining({ status: 'failed' }) as unknown,
        }),
      );
    });

    it('deletes every email older than 30 days, failed ones too', async () => {
      jest.useFakeTimers({
        now: new Date('2026-10-31T06:00:00.000Z'),
        doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
      });
      try {
        await service.retryFailed();
      } finally {
        jest.useRealTimers();
      }

      // No status filter: old failed rows must not keep addresses forever.
      expect(prisma.emailOutbox.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: new Date('2026-10-01T06:00:00.000Z') } },
      });
    });
  });
});
