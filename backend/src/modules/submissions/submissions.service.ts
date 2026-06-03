import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, Submission, Task, User } from '@prisma/client';

import type { AuthUser } from '@core/auth/auth.types';
import { PrismaService } from '@core/database/prisma.service';
import { toSubmissionDto, type SubmissionDto } from '@common/mappers';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ListSubmissionsQuery } from './dto/list-submissions.query';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(
    user: AuthUser,
    query: ListSubmissionsQuery,
  ): Promise<SubmissionDto[]> {
    const where: Prisma.SubmissionWhereInput = {};

    if (user.role === 'student') {
      where.userId = user.id;
    } else {
      if (query.taskId) where.taskId = query.taskId;
      if (query.status) where.status = query.status;
      if (query.cohortId) where.task = { cohortId: query.cohortId };
    }

    const subs = await this.prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { task: true, user: true },
    });

    return Promise.all(subs.map((s) => this.serialize(s, s.task, s.user)));
  }

  async findOne(id: number, user: AuthUser): Promise<SubmissionDto> {
    const sub = await this.prisma.submission.findUnique({
      where: { id },
      include: { task: true, user: true },
    });
    if (!sub) throw new NotFoundException('Submission not found.');
    if (user.role === 'student' && sub.userId !== user.id) {
      throw new ForbiddenException('Cannot view another student submission.');
    }
    return this.serialize(sub, sub.task, sub.user);
  }

  async create(
    dto: CreateSubmissionDto,
    user: AuthUser,
  ): Promise<SubmissionDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
    });
    if (!task) throw new NotFoundException('Task not found.');

    if (user.role === 'student') {
      if (task.status !== 'published') {
        throw new ForbiddenException('Task is not published.');
      }
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_cohortId: { userId: user.id, cohortId: task.cohortId },
        },
      });
      if (!enrollment) {
        throw new ForbiddenException(
          'You are not enrolled in the cohort for this task.',
        );
      }
    }

    const created = await this.prisma.submission.create({
      data: {
        taskId: dto.taskId,
        userId: user.id,
        content: dto.content,
        repoUrl: dto.repoUrl,
        status: 'submitted',
      },
    });
    await this.notifyAdminsOfSubmission(user, task.title);
    return this.serialize(created, task, user);
  }

  /**
   * Resubmit work against a submission the reviewer sent back. Only the owning
   * student may resubmit, and only while the submission is `needs_work`; this
   * moves it back into the review queue (`submitted`).
   */
  async resubmit(
    id: number,
    dto: UpdateSubmissionDto,
    user: AuthUser,
  ): Promise<SubmissionDto> {
    const sub = await this.prisma.submission.findUnique({
      where: { id },
      include: { task: true, user: true },
    });
    if (!sub) throw new NotFoundException('Submission not found.');
    if (sub.userId !== user.id) {
      throw new ForbiddenException('Cannot edit another student submission.');
    }
    if (sub.status !== 'needs_work') {
      throw new ForbiddenException(
        'Only submissions marked needs work can be resubmitted.',
      );
    }

    const updated = await this.prisma.submission.update({
      where: { id },
      data: {
        content: dto.content ?? sub.content,
        repoUrl: dto.repoUrl ?? sub.repoUrl,
        status: 'submitted',
      },
    });
    // A resubmission re-enters the review queue, so admins should hear about it.
    await this.notifyAdminsOfSubmission(user, sub.task?.title ?? 'a task');
    return this.serialize(updated, sub.task, sub.user);
  }

  /** Best-effort: a notification failure must never break a student's submit. */
  private async notifyAdminsOfSubmission(
    student: AuthUser,
    taskTitle: string,
  ): Promise<void> {
    try {
      await this.notifications.notifySubmissionReceived({
        studentName: student.name ?? student.email,
        taskTitle,
      });
    } catch (err) {
      this.logger.error(
        'Failed to notify admins of submission',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async serialize(
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
