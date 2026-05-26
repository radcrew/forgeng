import { Injectable } from '@nestjs/common';
import type { Submission, Task, User } from '@prisma/client';
import { ApplicationsService } from '../applications/applications.service';
import type { AuthUser } from '../common/auth/auth.types';
import {
  toApplicationDto,
  toCohortDto,
  toSubmissionDto,
  type ApplicationDto,
  type CohortDto,
  type SubmissionDto,
} from '../common/serializers';
import { PrismaService } from '../prisma/prisma.service';
import type { ApplicationStats } from '../applications/applications.service';

export interface StudentDashboard {
  cohort: CohortDto | null;
  taskStats: {
    total: number;
    submitted: number;
    approved: number;
    pending: number;
  };
  recentSubmissions: SubmissionDto[];
  nextDeadline: string | null;
}

export interface MentorDashboard {
  pendingReviews: number;
  recentActivity: SubmissionDto[];
  cohortBreakdown: {
    cohortId: number;
    cohortName: string;
    pendingCount: number;
  }[];
}

export interface AdminDashboard {
  applicationStats: ApplicationStats;
  activeCohorts: number;
  totalStudents: number;
  totalMentors: number;
  recentApplications: ApplicationDto[];
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
  ) {}

  async student(user: AuthUser): Promise<StudentDashboard> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId: user.id },
      include: { cohort: true },
      orderBy: { enrolledAt: 'desc' },
    });

    if (!enrollment) {
      return {
        cohort: null,
        taskStats: { total: 0, submitted: 0, approved: 0, pending: 0 },
        recentSubmissions: [],
        nextDeadline: null,
      };
    }

    const cohort = enrollment.cohort;
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

    return {
      cohort: toCohortDto(cohort, enrolledCount),
      taskStats,
      recentSubmissions,
      nextDeadline,
    };
  }

  async mentor(): Promise<MentorDashboard> {
    const pending = await this.prisma.submission.findMany({
      where: { status: 'submitted' },
      orderBy: { createdAt: 'desc' },
      include: { task: { include: { cohort: true } }, user: true },
    });

    const cohortPending = new Map<number, { name: string; count: number }>();
    for (const sub of pending) {
      const cohort = sub.task.cohort;
      const current = cohortPending.get(cohort.id);
      if (current) {
        current.count += 1;
      } else {
        cohortPending.set(cohort.id, { name: cohort.name, count: 1 });
      }
    }

    const cohortBreakdown = [...cohortPending.entries()].map(
      ([cohortId, { name, count }]) => ({
        cohortId,
        cohortName: name,
        pendingCount: count,
      }),
    );

    const recentActivity = await Promise.all(
      pending
        .slice(0, 10)
        .map((s) => this.serializeSubmission(s, s.task, s.user)),
    );

    return {
      pendingReviews: pending.length,
      recentActivity,
      cohortBreakdown,
    };
  }

  async admin(): Promise<AdminDashboard> {
    const [
      applicationStats,
      activeCohorts,
      totalStudents,
      totalMentors,
      recent,
    ] = await Promise.all([
      this.applications.stats(),
      this.prisma.cohort.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { role: 'student' } }),
      this.prisma.user.count({ where: { role: 'mentor' } }),
      this.prisma.application.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      applicationStats,
      activeCohorts,
      totalStudents,
      totalMentors,
      recentApplications: recent.map(toApplicationDto),
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
