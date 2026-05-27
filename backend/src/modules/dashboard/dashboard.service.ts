import { Injectable } from '@nestjs/common';
import type { Submission, Task, User } from '@prisma/client';
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

export interface AdminDashboard {
  applicationStats: ApplicationStats;
  activeCohorts: number;
  totalStudents: number;
  pendingReviews: number;
  recentApplications: ApplicationDto[];
  recentSubmissions: SubmissionDto[];
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
