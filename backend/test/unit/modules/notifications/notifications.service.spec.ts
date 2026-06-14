import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@core/mail';
import { PrismaService } from '@core/database/prisma.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import type { AuthUser } from '@core/auth/auth.types';

const user: AuthUser = { id: 2, role: 'student' } as AuthUser;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
      createMany: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    notificationPreference: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
    user: { findUnique: jest.Mock; findMany: jest.Mock };
    enrollment: { findMany: jest.Mock };
  };
  let mail: { send: jest.Mock };

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      notificationPreference: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
      },
      user: { findUnique: jest.fn(), findMany: jest.fn() },
      enrollment: { findMany: jest.fn() },
    };
    mail = { send: jest.fn().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue('https://app') };

    service = new NotificationsService(
      prisma as unknown as PrismaService,
      mail as unknown as MailService,
      config as unknown as ConfigService,
    );
  });

  describe('markRead', () => {
    it('hides another user notification as 404', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 1, userId: 999 });
      await expect(service.markRead(1, user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('marks an own unread notification read', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 1,
        userId: user.id,
        readAt: null,
      });
      prisma.notification.update.mockResolvedValue({
        id: 1,
        userId: user.id,
        readAt: new Date(),
        createdAt: new Date('2026-01-15T10:30:00.000Z'),
      });

      await service.markRead(1, user);

      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });
  });

  describe('delete', () => {
    it('hides another user notification as 404', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 1, userId: 999 });
      await expect(service.delete(1, user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });

    it('deletes an own notification', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 1,
        userId: user.id,
      });
      await service.delete(1, user);
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('notifyFeedbackReceived', () => {
    it('creates an in-app notification and emails by default', async () => {
      // No preference row -> all categories default to true.
      prisma.notificationPreference.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ email: 'ada@example.com' });

      await service.notifyFeedbackReceived({
        userId: 2,
        submissionId: 5,
        verdict: 'approved',
      });

      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mail.send).toHaveBeenCalledTimes(1);
    });

    it('respects disabled in-app and email preferences', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 2,
        feedbackInApp: false,
        feedbackEmail: false,
        taskInApp: true,
        taskEmail: true,
      });
      prisma.user.findUnique.mockResolvedValue({ email: 'ada@example.com' });

      await service.notifyFeedbackReceived({
        userId: 2,
        submissionId: 5,
        verdict: 'needs_work',
      });

      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(mail.send).not.toHaveBeenCalled();
    });
  });

  describe('notifyTaskPublished', () => {
    it('does nothing when the cohort has no enrollments', async () => {
      prisma.enrollment.findMany.mockResolvedValue([]);

      await service.notifyTaskPublished({ id: 5, cohortId: 3, title: 'CLI' });

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('notifies enrolled students in-app and by email by default', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        { userId: 2, user: { email: 'a@example.com' } },
        { userId: 3, user: { email: 'b@example.com' } },
      ]);
      prisma.notificationPreference.findMany.mockResolvedValue([]);

      await service.notifyTaskPublished({ id: 5, cohortId: 3, title: 'CLI' });

      expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
      expect(mail.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('notifySubmissionReceived', () => {
    it('creates an in-app notification for every admin', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }]);

      await service.notifySubmissionReceived({
        studentName: 'Ada',
        taskTitle: 'CLI',
      });

      const [arg] = prisma.notification.createMany.mock.calls[0] as [
        { data: unknown[] },
      ];
      expect(arg.data).toHaveLength(2);
    });

    it('does nothing when there are no admins', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await service.notifySubmissionReceived({
        studentName: 'Ada',
        taskTitle: 'CLI',
      });
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });

  describe('notifyPaymentEligible', () => {
    it('notifies admins and emails the student', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 10 }]);

      await service.notifyPaymentEligible({
        studentName: 'Ada',
        studentId: 2,
        studentEmail: 'ada@example.com',
      });

      expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ada@example.com' }),
      );
    });
  });

  describe('sendEmail resilience', () => {
    it('swallows email failures so the trigger still succeeds', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ email: 'ada@example.com' });
      mail.send.mockRejectedValue(new Error('smtp down'));

      await expect(
        service.notifyFeedbackReceived({
          userId: 2,
          submissionId: 5,
          verdict: 'approved',
        }),
      ).resolves.toBeUndefined();
    });
  });
});
