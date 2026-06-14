import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
    submission: { findUnique: jest.Mock; update: jest.Mock };
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
      submission: { findUnique: jest.fn(), update: jest.fn() },
      feedback: { findMany: jest.fn(), create: jest.fn() },
      task: { findUnique: jest.fn(), findMany: jest.fn() },
      notification: { findFirst: jest.fn() },
      user: { findUnique: jest.fn() },
      // The service passes an array of prepared queries; resolve them in order.
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
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
      prisma.submission.update.mockReturnValue('update-op');
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
      prisma.submission.update.mockReturnValue('update-op');
      prisma.feedback.create.mockReturnValue(makeFeedback());
      prisma.task.findUnique.mockResolvedValue({ cohortId: 3, dueDate: null });

      await service.create(10, reviewer, {
        content: 'ok',
        verdict: 'approved',
      } as never);

      const updateArg = (
        prisma.submission.update.mock.calls[0] as [{ data: { status: string } }]
      )[0].data;
      expect(updateArg.status).toBe('approved');
    });

    it('maps a non-approved verdict to needs_work', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 10,
        userId: student.id,
        taskId: 5,
      });
      prisma.submission.update.mockReturnValue('update-op');
      prisma.feedback.create.mockReturnValue(
        makeFeedback({ verdict: 'needs_work' }),
      );

      await service.create(10, reviewer, {
        content: 'fix this',
        verdict: 'needs_work',
      } as never);

      const updateArg = (
        prisma.submission.update.mock.calls[0] as [{ data: { status: string } }]
      )[0].data;
      expect(updateArg.status).toBe('needs_work');
      // Non-approved verdicts skip the payment-eligible path entirely.
      expect(notifications.notifyPaymentEligible).not.toHaveBeenCalled();
    });
  });
});
