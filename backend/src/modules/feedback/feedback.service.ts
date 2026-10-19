import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../core/auth/auth.types';
import { toFeedbackDto, type FeedbackDto } from '../../common/mappers';
import { PrismaService } from '../../core/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async checkAndNotifyPaymentEligible(
    userId: number,
    taskId: number,
  ): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { cohortId: true, dueDate: true },
    });
    if (!task?.dueDate) return;

    // Check the month the task was due, not the month of the review, so a
    // late review still counts toward that month's payment.
    const year = task.dueDate.getUTCFullYear();
    const month = task.dueDate.getUTCMonth();
    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 1) - 1);
    const monthLabel = monthStart.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

    const tasksThisMonth = await this.prisma.task.findMany({
      where: {
        cohortId: task.cohortId,
        status: 'published',
        dueDate: { gte: monthStart, lte: monthEnd },
      },
      select: { id: true },
    });
    if (tasksThisMonth.length === 0) return;

    const taskIds = tasksThisMonth.map((t) => t.id);
    // Count tasks, not submissions, so a duplicate can't stand in for a
    // task the student hasn't done.
    const approvedTasks = await this.prisma.submission.findMany({
      where: { userId, taskId: { in: taskIds }, status: 'approved' },
      select: { taskId: true },
      distinct: ['taskId'],
    });
    if (approvedTasks.length !== taskIds.length) return;

    // Alert admins once per student and month. The month name is part of
    // the alert, so a late alert for May isn't blocked by one for June.
    const alreadyNotified = await this.prisma.notification.findFirst({
      where: {
        type: 'payment_eligible',
        link: `/admin/users/${userId}`,
        body: { contains: `due in ${monthLabel}` },
      },
    });
    if (alreadyNotified) return;

    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    await this.notifications.notifyPaymentEligible({
      studentName: student?.name ?? student?.email ?? 'A student',
      studentId: userId,
      studentEmail: student?.email ?? '',
      month: monthLabel,
    });
  }

  async list(submissionId: number, user: AuthUser): Promise<FeedbackDto[]> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true },
    });
    if (!submission) throw new NotFoundException('Submission not found.');
    if (user.role === 'student' && submission.userId !== user.id) {
      throw new ForbiddenException(
        'Cannot view feedback on another student submission.',
      );
    }

    const items = await this.prisma.feedback.findMany({
      where: { submissionId },
      include: { reviewer: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((f) => toFeedbackDto(f, f.reviewer));
  }

  async create(
    submissionId: number,
    reviewer: AuthUser,
    dto: CreateFeedbackDto,
  ): Promise<FeedbackDto> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException('Submission not found.');

    const created = await this.prisma.$transaction(async (tx) => {
      // Only a submission that is waiting for review can be reviewed. The
      // status check and the update are one statement, so when two admins
      // review at the same time, only the first one wins.
      const { count } = await tx.submission.updateMany({
        where: { id: submissionId, status: 'submitted' },
        data: {
          status: dto.verdict === 'approved' ? 'approved' : 'needs_work',
        },
      });
      if (count === 0) {
        throw new ConflictException(
          'This submission was already reviewed. Refresh the page to see the review.',
        );
      }
      return tx.feedback.create({
        data: {
          submissionId,
          reviewerId: reviewer.id,
          content: dto.content,
          verdict: dto.verdict,
        },
      });
    });

    // The review is saved by now. A failed message must not report the
    // save as failed, or the reviewer tries again and gets a conflict.
    try {
      await this.notifications.notifyFeedbackReceived({
        userId: submission.userId,
        submissionId,
        verdict: dto.verdict,
      });
    } catch (err) {
      this.logger.error(
        'Failed to notify the student of feedback',
        err instanceof Error ? err.stack : String(err),
      );
    }

    if (dto.verdict === 'approved') {
      try {
        await this.checkAndNotifyPaymentEligible(
          submission.userId,
          submission.taskId,
        );
      } catch (err) {
        this.logger.error(
          'Failed to check payment eligibility',
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

    return toFeedbackDto(created, reviewer);
  }
}
