import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Feedback, Submission, User } from '@prisma/client';
import type { AuthUser } from '@core/auth/auth.types';
import { PrismaService } from '@core/database/prisma.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { FeedbackService } from '@modules/feedback/feedback.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

const reviewer: AuthUser = {
  id: 1,
  role: 'admin',
  createdAt: DATE,
} as AuthUser;
const student: AuthUser = {
  id: 2,
  role: 'student',
  createdAt: DATE,
} as AuthUser;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'rev@example.com',
    name: 'Rev Iewer',
    role: 'admin',
    createdAt: DATE,
    ...overrides,
  } as User;
}

function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 7,
    submissionId: 10,
    reviewerId: 1,
    content: 'Nice work',
    verdict: 'approved',
    createdAt: DATE,
    ...overrides,
  };
}

describe('FeedbackService', () => {
  let service: FeedbackService;
  let prisma: {
    submission: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      findMany: jest.Mock;
    };
    feedback: { findMany: jest.Mock; create: jest.Mock };
    task: { findUnique: jest.Mock; findMany: jest.Mock };
    notification: { findFirst: jest.Mock };
    user: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let notifications: {
    notifyFeedbackReceived: jest.Mock;
    notifyPaymentEligible: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      submission: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      feedback: { findMany: jest.fn(), create: jest.fn() },
      task: { findUnique: jest.fn(), findMany: jest.fn() },
      notification: { findFirst: jest.fn() },
      user: { findUnique: jest.fn() },
      // The service runs its queries in a callback; give it the same mock.
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
    };
    notifications = {
      notifyFeedbackReceived: jest.fn().mockResolvedValue(undefined),
      notifyPaymentEligible: jest.fn().mockResolvedValue(undefined),
    };

    service = new FeedbackService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  describe('list', () => {
    it('throws NotFoundException when the submission is missing', async () => {
      prisma.submission.findUnique.mockResolvedValue(null);
      await expect(service.list(10, reviewer)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('forbids a student from viewing feedback on another submission', async () => {
      prisma.submission.findUnique.mockResolvedValue({ userId: 999 });
      await expect(service.list(10, student)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('returns feedback for the owning student', async () => {
      prisma.submission.findUnique.mockResolvedValue({ userId: student.id });
      prisma.feedback.findMany.mockResolvedValue([
        { ...makeFeedback(), reviewer: makeUser() },
      ]);

      const result = await service.list(10, student);
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('throws NotFoundException when the submission is missing', async () => {
      prisma.submission.findUnique.mockResolvedValue(null);
      await expect(
        service.create(10, reviewer, {
          content: 'x',
          verdict: 'approved',
        } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('records feedback, updates status, and notifies the student', async () => {
      const submission = {
        id: 10,
        userId: student.id,
        taskId: 5,
      } as Submission;
      prisma.submission.findUnique.mockResolvedValue(submission);
      prisma.submission.updateMany.mockResolvedValue({ count: 1 });
      prisma.feedback.create.mockReturnValue(makeFeedback());
      // Task has no due date, so the payment-eligible check is a no-op.
      prisma.task.findUnique.mockResolvedValue({ cohortId: 3, dueDate: null });

      await service.create(10, reviewer, {
        content: 'Nice work',
        verdict: 'approved',
      } as never);

      expect(notifications.notifyFeedbackReceived).toHaveBeenCalledWith(
        expect.objectContaining({ userId: student.id, verdict: 'approved' }),
      );
    });

    it('maps an approved verdict to the approved submission status', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 10,
        userId: student.id,
        taskId: 5,
      });
      prisma.submission.updateMany.mockResolvedValue({ count: 1 });
      prisma.feedback.create.mockReturnValue(makeFeedback());
      prisma.task.findUnique.mockResolvedValue({ cohortId: 3, dueDate: null });

      await service.create(10, reviewer, {
        content: 'ok',
        verdict: 'approved',
      } as never);

      const updateArg = (
        prisma.submission.updateMany.mock.calls[0] as [
          { data: { status: string } },
        ]
      )[0].data;
      expect(updateArg.status).toBe('approved');
    });

    it('alerts for the month the task was due, even when reviewed later', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 10,
        userId: student.id,
        taskId: 5,
      });
      prisma.submission.updateMany.mockResolvedValue({ count: 1 });
      prisma.feedback.create.mockReturnValue(makeFeedback());
      // Due in May 2026; the review happens whenever the test runs.
      prisma.task.findUnique.mockResolvedValue({
        cohortId: 3,
        dueDate: new Date('2026-05-30T00:00:00.000Z'),
      });
      prisma.task.findMany.mockResolvedValue([{ id: 5 }]);
      prisma.submission.findMany.mockResolvedValue([{ taskId: 5 }]);
      prisma.notification.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({
        name: 'Stu',
        email: 'stu@example.com',
      });

      await service.create(10, reviewer, {
        content: 'ok',
        verdict: 'approved',
      } as never);

      // Only May's tasks are checked.
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: {
              gte: new Date('2026-05-01T00:00:00.000Z'),
              lte: new Date('2026-05-31T23:59:59.999Z'),
            },
          }) as unknown,
        }),
      );
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          body: { contains: 'due in May 2026' },
        }) as unknown,
      });
      expect(notifications.notifyPaymentEligible).toHaveBeenCalledWith(
        expect.objectContaining({ month: 'May 2026' }),
      );
    });

    it('counts approved tasks, not submissions, for payment eligibility', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 10,
        userId: student.id,
        taskId: 5,
      });
      prisma.submission.updateMany.mockResolvedValue({ count: 1 });
      prisma.feedback.create.mockReturnValue(makeFeedback());
      prisma.task.findUnique.mockResolvedValue({
        cohortId: 3,
        dueDate: new Date(),
      });
      // Two tasks are due this month, but only task 5 is approved.
      prisma.task.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }]);
      prisma.submission.findMany.mockResolvedValue([{ taskId: 5 }]);

      await service.create(10, reviewer, {
        content: 'ok',
        verdict: 'approved',
      } as never);

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ distinct: ['taskId'] }),
      );
      expect(notifications.notifyPaymentEligible).not.toHaveBeenCalled();
    });

    it('refuses a second review when the submission was already reviewed', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 10,
        userId: student.id,
        taskId: 5,
      });
      // Another admin changed the status first, so nothing matches.
      prisma.submission.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.create(10, reviewer, {
          content: 'ok',
          verdict: 'approved',
        } as never),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.submission.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10, status: 'submitted' },
        }),
      );
      expect(prisma.feedback.create).not.toHaveBeenCalled();
      expect(notifications.notifyFeedbackReceived).not.toHaveBeenCalled();
    });

    it('returns the saved review when the messages fail', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 10,
        userId: student.id,
        taskId: 5,
      });
      prisma.submission.updateMany.mockResolvedValue({ count: 1 });
      prisma.feedback.create.mockResolvedValue(makeFeedback());
      notifications.notifyFeedbackReceived.mockRejectedValue(
        new Error('mail down'),
      );
      prisma.task.findUnique.mockRejectedValue(new Error('db down'));

      const result = await service.create(10, reviewer, {
        content: 'ok',
        verdict: 'approved',
      } as never);

      expect(result.id).toBe(7);
    });

    it('maps a non-approved verdict to needs_work', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 10,
        userId: student.id,
        taskId: 5,
      });
      prisma.submission.updateMany.mockResolvedValue({ count: 1 });
      prisma.feedback.create.mockReturnValue(
        makeFeedback({ verdict: 'needs_work' }),
      );

      await service.create(10, reviewer, {
        content: 'fix this',
        verdict: 'needs_work',
      } as never);

      const updateArg = (
        prisma.submission.updateMany.mock.calls[0] as [
          { data: { status: string } },
        ]
      )[0].data;
      expect(updateArg.status).toBe('needs_work');
      // Non-approved verdicts skip the payment-eligible path entirely.
      expect(notifications.notifyPaymentEligible).not.toHaveBeenCalled();
    });
  });
});
