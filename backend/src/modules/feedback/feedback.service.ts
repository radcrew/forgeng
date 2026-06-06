import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '@core/auth/auth.types';
import { toFeedbackDto, type FeedbackDto } from '@common/mappers';
import { PrismaService } from '@core/database/prisma.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    if (task.dueDate < monthStart || task.dueDate > monthEnd) return;

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
    const approvedCount = await this.prisma.submission.count({
      where: { userId, taskId: { in: taskIds }, status: 'approved' },
    });
    if (approvedCount !== taskIds.length) return;

    // Avoid re-notifying admins if they were already alerted this month.
    const alreadyNotified = await this.prisma.notification.findFirst({
      where: {
        type: 'payment_eligible',
        link: `/admin/users/${userId}`,
        createdAt: { gte: monthStart },
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

    const [, created] = await this.prisma.$transaction([
      this.prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: dto.verdict === 'approved' ? 'approved' : 'needs_work',
        },
      }),
      this.prisma.feedback.create({
        data: {
          submissionId,
          reviewerId: reviewer.id,
          content: dto.content,
          verdict: dto.verdict,
        },
      }),
    ]);

    await this.notifications.notifyFeedbackReceived({
      userId: submission.userId,
      submissionId,
      verdict: dto.verdict,
    });

    if (dto.verdict === 'approved') {
      await this.checkAndNotifyPaymentEligible(
        submission.userId,
        submission.taskId,
      );
    }

    return toFeedbackDto(created, reviewer);
  }
}
