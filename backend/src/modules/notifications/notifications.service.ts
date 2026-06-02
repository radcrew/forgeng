import { Injectable, NotFoundException } from '@nestjs/common';
import type { Verdict } from '@prisma/client';
import type { AuthUser } from '@core/auth/auth.types';
import { toNotificationDto, type NotificationDto } from '@common/mappers';
import { PrismaService } from '@core/database/prisma.service';
import { ListNotificationsQuery } from './dto/list-notifications.query';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    user: AuthUser,
    query: ListNotificationsQuery,
  ): Promise<NotificationDto[]> {
    const items = await this.prisma.notification.findMany({
      where: { userId: user.id, ...(query.unread ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return items.map(toNotificationDto);
  }

  async unreadCount(user: AuthUser): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
    return { count };
  }

  async markRead(id: number, user: AuthUser): Promise<NotificationDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    // Hide other users' notifications as 404 so existence isn't leaked.
    if (!notification || notification.userId !== user.id) {
      throw new NotFoundException('Notification not found.');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: notification.readAt ?? new Date() },
    });
    return toNotificationDto(updated);
  }

  async markAllRead(user: AuthUser): Promise<{ count: number }> {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { count };
  }

  /** Notify a student that a reviewer left feedback on their submission. */
  async notifyFeedbackReceived(params: {
    userId: number;
    submissionId: number;
    verdict: Verdict;
  }): Promise<void> {
    const approved = params.verdict === 'approved';
    await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: 'feedback_received',
        title: approved
          ? 'Your submission was approved'
          : 'You received feedback',
        body: approved
          ? 'A reviewer approved your submission.'
          : 'A reviewer requested changes on your submission.',
        link: `/student/submissions/${params.submissionId}`,
      },
    });
  }

  /** Notify every enrolled student in a cohort that a new task is published. */
  async notifyTaskPublished(task: {
    id: number;
    cohortId: number;
    title: string;
  }): Promise<void> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { cohortId: task.cohortId },
      select: { userId: true },
    });
    if (enrollments.length === 0) return;

    await this.prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.userId,
        type: 'task_published' as const,
        title: 'New task published',
        body: task.title,
        link: `/student/tasks/${task.id}`,
      })),
    });
  }
}
