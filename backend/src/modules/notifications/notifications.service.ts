import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Verdict } from '@prisma/client';

import type { AppConfiguration } from '@config';
import type { AuthUser } from '@core/auth/auth.types';
import { MailService, type RenderedEmail } from '@core/mail';
import {
  toNotificationDto,
  toNotificationPreferenceDto,
  type NotificationDto,
  type NotificationPreferenceDto,
} from '@common/mappers';
import { PrismaService } from '@core/database/prisma.service';
import { ListNotificationsQuery } from './dto/list-notifications.query';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { feedbackReceivedEmail, taskPublishedEmail } from './templates';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

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

  async getPreferences(user: AuthUser): Promise<NotificationPreferenceDto> {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });
    return toNotificationPreferenceDto(pref);
  }

  async updatePreferences(
    user: AuthUser,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferenceDto> {
    const updated = await this.prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...dto },
      update: { ...dto },
    });
    return toNotificationPreferenceDto(updated);
  }

  /** Notify a student that a reviewer left feedback on their submission. */
  async notifyFeedbackReceived(params: {
    userId: number;
    submissionId: number;
    verdict: Verdict;
  }): Promise<void> {
    const { userId, verdict } = params;
    const approved = verdict === 'approved';
    // Submissions are viewed via a detail sheet on the list page; there is no
    // standalone /student/submissions/:id route, so deep-link to the list.
    const link = `/student/submissions`;

    const [prefRow, user] = await Promise.all([
      this.prisma.notificationPreference.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      }),
    ]);
    const prefs = toNotificationPreferenceDto(prefRow);

    if (prefs.feedbackInApp) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'feedback_received',
          title: approved
            ? 'Your submission was approved'
            : 'You received feedback',
          body: approved
            ? 'A reviewer approved your submission.'
            : 'A reviewer requested changes on your submission.',
          link,
        },
      });
    }

    if (prefs.feedbackEmail && user) {
      await this.sendEmail(
        user.email,
        feedbackReceivedEmail({ approved, url: this.absoluteUrl(link) }),
      );
    }
  }

  /** Notify every enrolled student in a cohort that a new task is published. */
  async notifyTaskPublished(task: {
    id: number;
    cohortId: number;
    title: string;
  }): Promise<void> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { cohortId: task.cohortId },
      select: { userId: true, user: { select: { email: true } } },
    });
    if (enrollments.length === 0) return;

    const userIds = enrollments.map((e) => e.userId);
    const prefRows = await this.prisma.notificationPreference.findMany({
      where: { userId: { in: userIds } },
    });
    const prefByUser = new Map(prefRows.map((p) => [p.userId, p]));
    const prefsFor = (userId: number) =>
      toNotificationPreferenceDto(prefByUser.get(userId) ?? null);

    const link = `/student/tasks/${task.id}`;

    const inAppUserIds = userIds.filter((id) => prefsFor(id).taskInApp);
    if (inAppUserIds.length > 0) {
      await this.prisma.notification.createMany({
        data: inAppUserIds.map((userId) => ({
          userId,
          type: 'task_published' as const,
          title: 'New task published',
          body: task.title,
          link,
        })),
      });
    }

    const url = this.absoluteUrl(link);
    const email = taskPublishedEmail({ taskTitle: task.title, url });
    const recipients = enrollments
      .filter((e) => prefsFor(e.userId).taskEmail)
      .map((e) => e.user.email);
    await Promise.all(recipients.map((to) => this.sendEmail(to, email)));
  }

  /**
   * Notify every admin that a student submitted work for review. In-app only —
   * admins have no per-category email preferences in the current model.
   */
  async notifySubmissionReceived(params: {
    studentName: string;
    taskTitle: string;
  }): Promise<void> {
    await this.notifyAdmins({
      type: 'submission_received',
      title: 'New submission to review',
      body: `${params.studentName} submitted "${params.taskTitle}"`,
      link: '/admin/reviews',
    });
  }

  /** Notify every admin that a new application was submitted. */
  async notifyApplicationReceived(params: {
    applicantName: string;
  }): Promise<void> {
    await this.notifyAdmins({
      type: 'application_received',
      title: 'New application received',
      body: `${params.applicantName} submitted an application`,
      link: '/admin/applications',
    });
  }

  private async notifyAdmins(notification: {
    type: 'submission_received' | 'application_received';
    title: string;
    body: string;
    link: string;
  }): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({ userId: a.id, ...notification })),
    });
  }

  private absoluteUrl(path: string): string {
    const base = this.config.get('frontendUrl', { infer: true });
    return `${base}${path}`;
  }

  /** Best-effort send: a failed email must never break the triggering action. */
  private async sendEmail(to: string, email: RenderedEmail): Promise<void> {
    try {
      await this.mail.send({ to, ...email });
    } catch (err) {
      this.logger.error(
        `Failed to send notification email to ${to}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
