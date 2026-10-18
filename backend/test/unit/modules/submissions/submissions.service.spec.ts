import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Cohort, Submission, Task, User } from '@prisma/client';
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

type TaskWithCohort = Task & {
  cohort: Pick<Cohort, 'status' | 'endDate'>;
};

function makeTask(overrides: Partial<TaskWithCohort> = {}): TaskWithCohort {
  return {
    id: 5,
    cohortId: 3,
    title: 'Build a CLI',
    description: null,
    type: 'project',
    status: 'published',
    dueDate: null,
    createdAt: DATE,
    cohort: { status: 'active', endDate: null },
    ...overrides,
  } as TaskWithCohort;
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
    lastSubmittedAt: DATE,
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
      findFirst: jest.Mock;
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
        // No earlier submission for the task unless a test says so.
        findFirst: jest.fn().mockResolvedValue(null),
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

    it('shows a student only the cohort they selected', async () => {
      prisma.submission.findMany.mockResolvedValue([]);

      await service.list(student, { cohortId: 7, status: 'approved' });

      // Students can filter by cohort, but not by other admin filters.
      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: student.id, task: { cohortId: 7 } },
        }),
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
    it('refuses a second submission for the same task', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask());
      prisma.enrollment.findUnique.mockResolvedValue({ id: 1 });
      prisma.submission.findFirst.mockResolvedValue({ id: 10 });

      await expect(
        service.create({ taskId: 5, content: 'x' }, student),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.submission.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { taskId: 5, userId: student.id } }),
      );
      expect(prisma.submission.create).not.toHaveBeenCalled();
    });

    it('rejects a submission with no repo link and a blank write-up', async () => {
      await expect(
        service.create({ taskId: 5, content: '   ' }, student),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.submission.create).not.toHaveBeenCalled();
    });

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

    it.each([
      ['marked completed', { status: 'completed' as const, endDate: null }],
      [
        'past its end date',
        {
          status: 'active' as const,
          endDate: new Date('2020-01-01T00:00:00Z'),
        },
      ],
    ])('forbids submitting to a cohort %s', async (_label, cohort) => {
      prisma.task.findUnique.mockResolvedValue(makeTask({ cohort }));
      await expect(
        service.create({ taskId: 5, content: 'x' }, student),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.submission.create).not.toHaveBeenCalled();
    });

    it('still accepts work on the cohort end day', async () => {
      // Saved as midnight UTC today, so the end day is not over yet.
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      prisma.task.findUnique.mockResolvedValue(
        makeTask({ cohort: { status: 'active', endDate: today } }),
      );
      prisma.enrollment.findUnique.mockResolvedValue({ id: 1 });
      prisma.submission.create.mockResolvedValue(makeSubmission());

      await expect(
        service.create({ taskId: 5, content: 'x' }, student),
      ).resolves.toBeDefined();
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

    it('gives a first send the same created and last-submitted time', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask());
      prisma.enrollment.findUnique.mockResolvedValue({ id: 1 });
      prisma.submission.create.mockResolvedValue(makeSubmission());

      await service.create({ taskId: 5, content: 'x' }, student);

      const { data } = (
        prisma.submission.create.mock.calls[0] as [
          { data: { createdAt: Date; lastSubmittedAt: Date } },
        ]
      )[0];
      expect(data.createdAt).toBeInstanceOf(Date);
      expect(data.lastSubmittedAt).toBe(data.createdAt);
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

    it('rejects a resubmission that would leave no work', async () => {
      prisma.submission.findUnique.mockResolvedValue(
        makeSubmission({ status: 'needs_work', content: null }),
      );
      await expect(
        service.resubmit(10, { content: ' ' }, student),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.submission.update).not.toHaveBeenCalled();
    });

    it('removes the repo link when it is sent as null', async () => {
      prisma.submission.findUnique.mockResolvedValue(
        makeSubmission({
          status: 'needs_work',
          content: 'my work',
          repoUrl: 'https://github.com/me/old',
          task: makeTask(),
          user: makeUser(),
        }),
      );
      prisma.submission.update.mockResolvedValue(makeSubmission());

      await service.resubmit(10, { repoUrl: null }, student);

      const data = (
        prisma.submission.update.mock.calls[0] as [
          { data: { content: unknown; repoUrl: unknown } },
        ]
      )[0].data;
      expect(data.repoUrl).toBeNull();
      // Left out, so the write-up stays.
      expect(data.content).toBe('my work');
    });

    it('refuses to remove both the write-up and the repo link', async () => {
      prisma.submission.findUnique.mockResolvedValue(
        makeSubmission({
          status: 'needs_work',
          content: 'my work',
          repoUrl: 'https://github.com/me/old',
        }),
      );

      await expect(
        service.resubmit(10, { content: null, repoUrl: null }, student),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.submission.update).not.toHaveBeenCalled();
    });

    it('forbids resubmitting once the cohort has ended', async () => {
      prisma.submission.findUnique.mockResolvedValue(
        makeSubmission({
          status: 'needs_work',
          task: makeTask({ cohort: { status: 'completed', endDate: null } }),
        }),
      );
      await expect(
        service.resubmit(10, { content: 'redone' }, student),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.submission.update).not.toHaveBeenCalled();
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
        prisma.submission.update.mock.calls[0] as [
          { data: { status: string; lastSubmittedAt: unknown } },
        ]
      )[0].data;
      expect(data.status).toBe('submitted');
      expect(data.lastSubmittedAt).toBeInstanceOf(Date);
      expect(notifications.notifySubmissionReceived).toHaveBeenCalledTimes(1);
    });
  });
});
