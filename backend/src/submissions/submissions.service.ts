import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, Submission, Task, User } from '@prisma/client';
import type { AuthUser } from '../common/auth/auth.types';
import { toSubmissionDto, type SubmissionDto } from '../common/serializers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ListSubmissionsQuery } from './dto/list-submissions.query';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Students may only submit to published tasks in cohorts they're
    // enrolled in. Mentors / admins are unrestricted (e.g. to seed demo data).
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
    return this.serialize(created, task, user);
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
