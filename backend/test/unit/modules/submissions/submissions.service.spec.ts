import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Submission, Task, User } from '@prisma/client';
import type { AuthUser } from '@core/auth/auth.types';
import { PrismaService } from '@core/database/prisma.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { SubmissionsService } from '@modules/submissions/submissions.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

const admin: AuthUser = { id: 1, role: 'admin', createdAt: DATE } as AuthUser;
const student: AuthUser = {
  id: 2,
  role: 'student',
  email: 'stu@example.com',
  createdAt: DATE,
} as AuthUser;

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 5,
    cohortId: 3,
    title: 'Build a CLI',
    description: null,
    type: 'project',
    status: 'published',
    dueDate: null,
    createdAt: DATE,
    ...overrides,
  } as Task;
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 2,
    email: 'stu@example.com',
    name: 'Stu Dent',
    role: 'student',
    createdAt: DATE,
    ...overrides,
  } as User;
}

function makeSubmission(
  overrides: Partial<Submission> = {},
): Submission & { task?: Task; user?: User } {
  return {
    id: 10,
    taskId: 5,
    userId: 2,
    content: 'my work',
    repoUrl: null,
    status: 'submitted',
    createdAt: DATE,
    ...overrides,
  } as Submission;
}

describe('SubmissionsService', () => {
  let service: SubmissionsService;
  let prisma: {
    submission: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    task: { findUnique: jest.Mock };
    enrollment: { findUnique: jest.Mock };
    feedback: { count: jest.Mock };
  };
  let notifications: { notifySubmissionReceived: jest.Mock };

  beforeEach(() => {
    prisma = {
      submission: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      task: { findUnique: jest.fn() },
      enrollment: { findUnique: jest.fn() },
      feedback: { count: jest.fn().mockResolvedValue(0) },
    };
    notifications = {
      notifySubmissionReceived: jest.fn().mockResolvedValue(undefined),
    };

    service = new SubmissionsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  describe('list', () => {
    it('scopes a student to their own submissions', async () => {
      prisma.submission.findMany.mockResolvedValue([]);

      await service.list(student, {});

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: student.id } }),
      );
    });

    it('applies admin filters for task, status, and cohort', async () => {
      prisma.submission.findMany.mockResolvedValue([]);

      await service.list(admin, { taskId: 5, status: 'approved', cohortId: 3 });

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { taskId: 5, status: 'approved', task: { cohortId: 3 } },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the submission is missing', async () => {
      prisma.submission.findUnique.mockResolvedValue(null);
      await expect(service.findOne(10, admin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('forbids a student from viewing another student submission', async () => {
      prisma.submission.findUnique.mockResolvedValue(
        makeSubmission({ userId: 999, task: makeTask(), user: makeUser() }),
      );
      await expect(service.findOne(10, student)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('returns the submission to its owning student', async () => {
      prisma.submission.findUnique.mockResolvedValue(
        makeSubmission({ task: makeTask(), user: makeUser() }),
      );

      const dto = await service.findOne(10, student);
      expect(dto.id).toBe(10);
    });
  });

  describe('create', () => {
    it('throws NotFoundException when the task does not exist', async () => {
      prisma.task.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ taskId: 5, content: 'x' }, student),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids a student from submitting to an unpublished task', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask({ status: 'draft' }));
      await expect(
        service.create({ taskId: 5, content: 'x' }, student),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids a student who is not enrolled in the task cohort', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask());
      prisma.enrollment.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ taskId: 5, content: 'x' }, student),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('creates a submission for an enrolled student and notifies admins', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask());
      prisma.enrollment.findUnique.mockResolvedValue({ id: 1 });
      prisma.submission.create.mockResolvedValue(makeSubmission());

      const dto = await service.create({ taskId: 5, content: 'x' }, student);

      expect(dto.id).toBe(10);
      expect(notifications.notifySubmissionReceived).toHaveBeenCalledTimes(1);
    });

    it('does not let a notification failure break the submission', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask());
      prisma.enrollment.findUnique.mockResolvedValue({ id: 1 });
      prisma.submission.create.mockResolvedValue(makeSubmission());
      notifications.notifySubmissionReceived.mockRejectedValue(
        new Error('smtp down'),
      );

      await expect(
        service.create({ taskId: 5, content: 'x' }, student),
      ).resolves.toBeDefined();
    });
  });

  describe('resubmit', () => {
    it('throws NotFoundException when the submission is missing', async () => {
      prisma.submission.findUnique.mockResolvedValue(null);
      await expect(service.resubmit(10, {}, student)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('forbids resubmitting another student submission', async () => {
      prisma.submission.findUnique.mockResolvedValue(
        makeSubmission({ userId: 999, status: 'needs_work' }),
      );
      await expect(service.resubmit(10, {}, student)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('forbids resubmitting unless the status is needs_work', async () => {
      prisma.submission.findUnique.mockResolvedValue(
        makeSubmission({ status: 'submitted' }),
      );
      await expect(service.resubmit(10, {}, student)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('moves a needs_work submission back to submitted', async () => {
      prisma.submission.findUnique.mockResolvedValue(
        makeSubmission({
          status: 'needs_work',
          task: makeTask(),
          user: makeUser(),
        }),
      );
      prisma.submission.update.mockResolvedValue(
        makeSubmission({ status: 'submitted' }),
      );

      await service.resubmit(10, { content: 'redone' }, student);

      const data = (
        prisma.submission.update.mock.calls[0] as [{ data: { status: string } }]
      )[0].data;
      expect(data.status).toBe('submitted');
      expect(notifications.notifySubmissionReceived).toHaveBeenCalledTimes(1);
    });
  });
});
