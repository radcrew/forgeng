import type { Cohort, Submission, Task } from '@prisma/client';
import type { AuthUser } from '@core/auth/auth.types';
import { PrismaService } from '@core/database/prisma.service';
import { ApplicationsService } from '@modules/applications/applications.service';
import { DashboardService } from '@modules/dashboard/dashboard.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');
const student: AuthUser = {
  id: 2,
  role: 'student',
  createdAt: DATE,
} as AuthUser;

function makeCohort(overrides: Partial<Cohort> = {}): Cohort {
  return {
    id: 3,
    name: 'Spring',
    description: null,
    capacity: 30,
    status: 'active',
    startDate: null,
    endDate: null,
    createdAt: DATE,
    ...overrides,
  } as Cohort;
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    cohortId: 3,
    title: 'Task',
    description: null,
    type: 'project',
    status: 'published',
    dueDate: null,
    createdAt: DATE,
    ...overrides,
  } as Task;
}

function makeSubmission(
  overrides: Partial<Submission> = {},
): Submission & { task?: Task } {
  return {
    id: 10,
    taskId: 1,
    userId: 2,
    content: 'work',
    repoUrl: null,
    status: 'submitted',
    lastSubmittedAt: DATE,
    createdAt: DATE,
    ...overrides,
  } as Submission;
}

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    enrollment: { findMany: jest.Mock; count: jest.Mock };
    task: { findMany: jest.Mock };
    submission: {
      findMany: jest.Mock;
      count: jest.Mock;
      groupBy: jest.Mock;
    };
    cohort: { count: jest.Mock; findMany: jest.Mock };
    user: { count: jest.Mock };
    application: { findMany: jest.Mock };
    feedback: { count: jest.Mock };
  };
  let applications: { stats: jest.Mock };

  beforeEach(() => {
    prisma = {
      enrollment: {
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
      task: { findMany: jest.fn() },
      submission: {
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      cohort: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn() },
      user: { count: jest.fn().mockResolvedValue(0) },
      application: { findMany: jest.fn() },
      feedback: { count: jest.fn().mockResolvedValue(0) },
    };
    applications = { stats: jest.fn().mockResolvedValue({ total: 0 }) };

    service = new DashboardService(
      prisma as unknown as PrismaService,
      applications as unknown as ApplicationsService,
    );
  });

  describe('student', () => {
    it('returns an empty dashboard when the student has no enrollments', async () => {
      prisma.enrollment.findMany.mockResolvedValue([]);

      const result = await service.student(student);

      expect(result.cohort).toBeNull();
      expect(result.cohorts).toEqual([]);
      expect(result.taskStats).toEqual({
        total: 0,
        submitted: 0,
        approved: 0,
        pending: 0,
      });
      // The weekly activity buckets are still built for an empty student.
      expect(result.analytics.weeklyActivity).toHaveLength(6);
    });

    it('aggregates task stats from the student submissions', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        {
          cohortId: 3,
          cohort: makeCohort({ id: 3, name: 'Spring' }),
          enrolledAt: DATE,
        },
      ]);
      prisma.task.findMany.mockResolvedValue([
        makeTask({ id: 1 }),
        makeTask({ id: 2 }),
        makeTask({ id: 3 }),
      ]);
      prisma.submission.findMany.mockResolvedValue([
        makeSubmission({
          id: 11,
          taskId: 1,
          status: 'approved',
          task: makeTask({ id: 1 }),
        }),
        makeSubmission({
          id: 12,
          taskId: 2,
          status: 'submitted',
          task: makeTask({ id: 2 }),
        }),
      ]);

      const result = await service.student(student);

      expect(result.taskStats.total).toBe(3);
      expect(result.taskStats.submitted).toBe(2);
      expect(result.taskStats.approved).toBe(1);
      expect(result.taskStats.pending).toBe(1);
      expect(result.cohort?.name).toBe('Spring');
    });

    it('ignores submissions outside the selected cohort, so progress stays within 100%', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        {
          cohortId: 3,
          cohort: makeCohort({ id: 3, name: 'Spring' }),
          enrolledAt: DATE,
        },
      ]);
      // One published task in this cohort.
      prisma.task.findMany.mockResolvedValue([makeTask({ id: 1 })]);
      // Approved work on that task, plus on tasks 8 and 9 from another cohort
      // or moved back to draft.
      prisma.submission.findMany.mockResolvedValue(
        [1, 8, 9].map((taskId) =>
          makeSubmission({
            id: 100 + taskId,
            taskId,
            status: 'approved',
            task: makeTask({ id: taskId }),
          }),
        ),
      );

      const result = await service.student(student);

      expect(result.taskStats.total).toBe(1);
      expect(result.taskStats.submitted).toBe(1);
      expect(result.taskStats.approved).toBe(1);
    });

    it('lists the student submissions by the latest send', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        { cohortId: 3, cohort: makeCohort({ id: 3 }), enrolledAt: DATE },
      ]);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.submission.findMany.mockResolvedValue([]);

      await service.student(student);

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: student.id },
          orderBy: [{ lastSubmittedAt: 'desc' }, { id: 'desc' }],
        }),
      );
    });

    it('skips past due dates when picking the next deadline', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        {
          cohortId: 3,
          cohort: makeCohort({ id: 3, name: 'Spring' }),
          enrolledAt: DATE,
        },
      ]);
      prisma.task.findMany.mockResolvedValue([
        // Missed long ago, never submitted.
        makeTask({ id: 1, dueDate: new Date('2020-01-01T00:00:00.000Z') }),
        // Still ahead.
        makeTask({ id: 2, dueDate: new Date('2099-06-01T00:00:00.000Z') }),
        makeTask({ id: 3, dueDate: new Date('2099-09-01T00:00:00.000Z') }),
      ]);
      prisma.submission.findMany.mockResolvedValue([]);

      const result = await service.student(student);

      expect(result.nextDeadline).toBe('2099-06-01T00:00:00.000Z');
    });

    it('counts a task with no submission as todo in the status breakdown', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        {
          cohortId: 3,
          cohort: makeCohort({ id: 3, name: 'Spring' }),
          enrolledAt: DATE,
        },
      ]);
      prisma.task.findMany.mockResolvedValue([
        makeTask({ id: 1 }),
        makeTask({ id: 2 }),
      ]);
      prisma.submission.findMany.mockResolvedValue([
        makeSubmission({
          taskId: 1,
          status: 'approved',
          task: makeTask({ id: 1 }),
        }),
      ]);

      const result = await service.student(student);

      expect(result.analytics.statusBreakdown.approved).toBe(1);
      expect(result.analytics.statusBreakdown.todo).toBe(1);
    });

    it('falls back to the most recent enrollment for an unknown cohortId', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        {
          cohortId: 7,
          cohort: makeCohort({ id: 7, name: 'Newest' }),
          enrolledAt: DATE,
        },
        {
          cohortId: 3,
          cohort: makeCohort({ id: 3, name: 'Older' }),
          enrolledAt: DATE,
        },
      ]);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.submission.findMany.mockResolvedValue([]);

      const result = await service.student(student, 999);

      // 999 is not enrolled, so it uses enrollments[0] (newest).
      expect(result.cohort?.name).toBe('Newest');
    });
  });

  describe('admin', () => {
    it('assembles platform-wide counts and recent items', async () => {
      prisma.cohort.count.mockResolvedValue(2);
      prisma.user.count.mockResolvedValue(15);
      prisma.submission.count.mockResolvedValue(4);
      prisma.application.findMany.mockResolvedValue([]);
      prisma.submission.findMany.mockResolvedValue([]);
      prisma.submission.groupBy.mockResolvedValue([
        { status: 'approved', _count: { _all: 9 } },
        { status: 'submitted', _count: { _all: 4 } },
      ]);
      prisma.cohort.findMany.mockResolvedValue([]);
      prisma.task.findMany.mockResolvedValue([]);

      const result = await service.admin();

      expect(result.activeCohorts).toBe(2);
      expect(result.totalStudents).toBe(15);
      expect(result.pendingReviews).toBe(4);
      expect(result.analytics.submissionBreakdown.approved).toBe(9);
      expect(result.analytics.submissionBreakdown.submitted).toBe(4);
      expect(result.analytics.submissionBreakdown.needsWork).toBe(0);
      // Waiting work is listed by the latest send, like the review queue.
      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'submitted' },
          orderBy: [{ lastSubmittedAt: 'desc' }, { id: 'desc' }],
        }),
      );
    });

    it('rolls submission counts up to their cohort', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      prisma.submission.findMany.mockResolvedValue([]);
      prisma.submission.groupBy.mockResolvedValue([]);
      prisma.cohort.findMany.mockResolvedValue([
        {
          id: 3,
          name: 'Spring',
          status: 'active',
          _count: { enrollments: 5, tasks: 2 },
        },
      ]);
      prisma.task.findMany.mockResolvedValue([
        { cohortId: 3, _count: { submissions: 4 } },
        { cohortId: 3, _count: { submissions: 3 } },
      ]);

      const result = await service.admin();

      expect(result.analytics.cohortStats).toHaveLength(1);
      expect(result.analytics.cohortStats[0]).toMatchObject({
        id: 3,
        students: 5,
        tasks: 2,
        submissions: 7,
      });
    });
  });
});
