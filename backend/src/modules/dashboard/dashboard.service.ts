import { Injectable } from '@nestjs/common';
import type {
  CohortStatus,
  Submission,
  SubmissionStatus,
  Task,
  TaskType,
  User,
} from '@prisma/client';
import { ApplicationsService } from '@modules/applications/applications.service';
import type { AuthUser } from '@core/auth/auth.types';
import {
  toApplicationDto,
  toCohortDto,
  toSubmissionDto,
  type ApplicationDto,
  type CohortDto,
  type SubmissionDto,
} from '@common/mappers';
import { PrismaService } from '@core/database/prisma.service';
import type { ApplicationStats } from '@modules/applications/applications.service';

export interface StudentAnalytics {
  // Mutually exclusive task buckets based on each task's latest submission.
  statusBreakdown: {
    todo: number;
    submitted: number;
    needsWork: number;
    approved: number;
  };
  typeBreakdown: { type: TaskType; total: number; approved: number }[];
  // Submissions per week for the trailing weeks, oldest first.
  weeklyActivity: { weekStart: string; submissions: number }[];
}

export interface StudentDashboard {
  cohort: CohortDto | null;
  // All cohorts the student is enrolled in, newest first — drives the cohort
  // switcher. Empty when the student has no enrollments.
  cohorts: { id: number; name: string }[];
  taskStats: {
    total: number;
    submitted: number;
    approved: number;
    pending: number;
  };
  recentSubmissions: SubmissionDto[];
  nextDeadline: string | null;
  analytics: StudentAnalytics;
}

export interface AdminCohortStat {
  id: number;
  name: string;
  status: CohortStatus;
  students: number;
  tasks: number;
  submissions: number;
}

export interface AdminAnalytics {
  // Platform-wide submission counts by current status.
  submissionBreakdown: {
    submitted: number;
    approved: number;
    needsWork: number;
  };
  // Submissions per week across the platform, oldest first.
  weeklyActivity: { weekStart: string; submissions: number }[];
  // Per-cohort rollup, newest cohort first.
  cohortStats: AdminCohortStat[];
}

export interface AdminDashboard {
  applicationStats: ApplicationStats;
  activeCohorts: number;
  totalStudents: number;
  pendingReviews: number;
  recentApplications: ApplicationDto[];
  recentSubmissions: SubmissionDto[];
  analytics: AdminAnalytics;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
  ) {}

  async student(user: AuthUser, cohortId?: number): Promise<StudentDashboard> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: user.id },
      include: { cohort: true },
      orderBy: { enrolledAt: 'desc' },
    });

    if (enrollments.length === 0) {
      return {
        cohort: null,
        cohorts: [],
        taskStats: { total: 0, submitted: 0, approved: 0, pending: 0 },
        recentSubmissions: [],
        nextDeadline: null,
        analytics: {
          statusBreakdown: { todo: 0, submitted: 0, needsWork: 0, approved: 0 },
          typeBreakdown: [],
          weeklyActivity: this.buildWeeklyActivity([]),
        },
      };
    }

    const cohorts = enrollments.map((e) => ({
      id: e.cohort.id,
      name: e.cohort.name,
    }));

    // Honour the requested cohort when the student is actually enrolled in it;
    // otherwise fall back to the most recent enrollment.
    const selected =
      (cohortId != null && enrollments.find((e) => e.cohortId === cohortId)) ||
      enrollments[0];
    const cohort = selected.cohort;
    const tasks = await this.prisma.task.findMany({
      where: { cohortId: cohort.id, status: 'published' },
    });
    const mySubmissions = await this.prisma.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { task: true },
    });

    const submittedTaskIds = new Set(mySubmissions.map((s) => s.taskId));
    const approvedIds = new Set(
      mySubmissions.filter((s) => s.status === 'approved').map((s) => s.taskId),
    );

    const taskStats = {
      total: tasks.length,
      submitted: submittedTaskIds.size,
      approved: approvedIds.size,
      pending: Math.max(0, tasks.length - submittedTaskIds.size),
    };

    const upcoming = tasks
      .filter((t) => t.dueDate && !submittedTaskIds.has(t.id))
      .sort(
        (a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0),
      );
    const nextDeadline = upcoming[0]?.dueDate?.toISOString() ?? null;

    const recentSubs = mySubmissions.slice(0, 5);
    const recentSubmissions = await Promise.all(
      recentSubs.map((s) => this.serializeSubmission(s, s.task, user)),
    );

    const enrolledCount = await this.prisma.enrollment.count({
      where: { cohortId: cohort.id },
    });

    // Latest submission status per task (mySubmissions is newest-first, so the
    // first occurrence of a taskId is its current state).
    const latestStatusByTask = new Map<number, SubmissionStatus>();
    for (const s of mySubmissions) {
      if (!latestStatusByTask.has(s.taskId)) {
        latestStatusByTask.set(s.taskId, s.status);
      }
    }

    const statusBreakdown = {
      todo: 0,
      submitted: 0,
      needsWork: 0,
      approved: 0,
    };
    const byType = new Map<TaskType, { total: number; approved: number }>();
    for (const t of tasks) {
      const status = latestStatusByTask.get(t.id);
      if (!status) statusBreakdown.todo += 1;
      else if (status === 'approved') statusBreakdown.approved += 1;
      else if (status === 'needs_work') statusBreakdown.needsWork += 1;
      else statusBreakdown.submitted += 1;

      const entry = byType.get(t.type) ?? { total: 0, approved: 0 };
      entry.total += 1;
      if (status === 'approved') entry.approved += 1;
      byType.set(t.type, entry);
    }

    const typeBreakdown = [...byType.entries()]
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.total - a.total);

    return {
      cohort: toCohortDto(cohort, enrolledCount),
      cohorts,
      taskStats,
      recentSubmissions,
      nextDeadline,
      analytics: {
        statusBreakdown,
        typeBreakdown,
        weeklyActivity: this.buildWeeklyActivity(mySubmissions),
      },
    };
  }

  private buildWeeklyActivity(
    submissions: { createdAt: Date }[],
  ): StudentAnalytics['weeklyActivity'] {
    const WEEKS = 6;
    const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const buckets = Array.from({ length: WEEKS }, (_, i) => ({
      weekStart: new Date(now - (WEEKS - 1 - i) * MS_WEEK).toISOString(),
      submissions: 0,
    }));
    for (const s of submissions) {
      const idx = Math.floor((now - s.createdAt.getTime()) / MS_WEEK);
      if (idx >= 0 && idx < WEEKS) buckets[WEEKS - 1 - idx].submissions += 1;
    }
    return buckets;
  }

  async admin(): Promise<AdminDashboard> {
    const [
      applicationStats,
      activeCohorts,
      totalStudents,
      pendingReviews,
      recentApplications,
      pendingSubmissions,
    ] = await Promise.all([
      this.applications.stats(),
      this.prisma.cohort.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { role: 'student' } }),
      this.prisma.submission.count({ where: { status: 'submitted' } }),
      this.prisma.application.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.submission.findMany({
        where: { status: 'submitted' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { task: true, user: true },
      }),
    ]);

    const recentSubmissions = await Promise.all(
      pendingSubmissions.map((s) =>
        this.serializeSubmission(s, s.task, s.user),
      ),
    );

    return {
      applicationStats,
      activeCohorts,
      totalStudents,
      pendingReviews,
      recentApplications: recentApplications.map(toApplicationDto),
      recentSubmissions,
      analytics: await this.adminAnalytics(),
    };
  }

  private async adminAnalytics(): Promise<AdminAnalytics> {
    const WEEKS = 6;
    const since = new Date(Date.now() - WEEKS * 7 * 24 * 60 * 60 * 1000);

    const [byStatus, recentSubs, cohorts, tasksWithCounts] = await Promise.all([
      this.prisma.submission.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.submission.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.cohort.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { enrollments: true, tasks: true } } },
      }),
      // Submissions hang off tasks, so roll them up to the cohort in memory.
      this.prisma.task.findMany({
        select: { cohortId: true, _count: { select: { submissions: true } } },
      }),
    ]);

    const countFor = (status: SubmissionStatus): number =>
      byStatus.find((row) => row.status === status)?._count._all ?? 0;

    const subsByCohort = new Map<number, number>();
    for (const t of tasksWithCounts) {
      subsByCohort.set(
        t.cohortId,
        (subsByCohort.get(t.cohortId) ?? 0) + t._count.submissions,
      );
    }

    return {
      submissionBreakdown: {
        submitted: countFor('submitted'),
        approved: countFor('approved'),
        needsWork: countFor('needs_work'),
      },
      weeklyActivity: this.buildWeeklyActivity(recentSubs),
      cohortStats: cohorts.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        students: c._count.enrollments,
        tasks: c._count.tasks,
        submissions: subsByCohort.get(c.id) ?? 0,
      })),
    };
  }

  private async serializeSubmission(
    sub: Submission,
    task: Task | null,
    user: User | null,
  ): Promise<SubmissionDto> {
    const feedbackCount = await this.prisma.feedback.count({
      where: { submissionId: sub.id },
    });
    return toSubmissionDto(sub, task, user, feedbackCount);
  }
}
