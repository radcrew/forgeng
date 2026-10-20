import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Verdict } from '@prisma/client';

import type { AppConfiguration } from '../../config';
import type { AuthUser } from '../../core/auth/auth.types';
import { MailService, type RenderedEmail } from '../../core/mail';
import { SLACK_ACTIONS, SlackService, submissionKey } from '../../core/slack';
import {
  toNotificationDto,
  toNotificationPreferenceDto,
  type NotificationDto,
  type NotificationPreferenceDto,
} from '../../common/mappers';
import { ADMIN_ROUTES, STUDENT_ROUTES } from '../../common/constants/routes';
import { PrismaService } from '../../core/database/prisma.service';
import { ListNotificationsQuery } from './dto/list-notifications.query';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import {
  feedbackReceivedEmail,
  paymentEligibleEmail,
  taskPublishedEmail,
} from './templates';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService<AppConfiguration, true>,
    private readonly slack: SlackService,
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

  async delete(id: number, user: AuthUser): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.userId !== user.id) {
      throw new NotFoundException('Notification not found.');
    }
    await this.prisma.notification.delete({ where: { id } });
  }

  async deleteAll(user: AuthUser): Promise<{ count: number }> {
    const { count } = await this.prisma.notification.deleteMany({
      where: { userId: user.id },
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
    const link = STUDENT_ROUTES.SUBMISSIONS;

    const [prefRow, user] = await Promise.all([
      this.prisma.notificationPreference.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, slackUserId: true },
      }),
    ]);
    const prefs = toNotificationPreferenceDto(prefRow);

    // First: a failed in-app notice must not skip the Slack message. Only
    // for a student who has joined the Forgeng Slack.
    if (prefs.feedbackSlack && user?.slackUserId) {
      this.slack.postInBackground(user.slackUserId, {
        text: approved
          ? 'A reviewer approved your submission. Great work!'
          : 'A reviewer asked for changes on your submission. Open it to read the feedback.',
        link: { label: 'Open submissions', url: this.absoluteUrl(link) },
      });
    }

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
      this.sendEmail(
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
    const link = STUDENT_ROUTES.TASK(task.id);

    // To the cohort's channel, even before anyone is enrolled: students who
    // join later still see it there.
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: task.cohortId },
      select: { slackChannelId: true },
    });
    this.slack.postInBackground(cohort?.slackChannelId ?? null, {
      text: `New task: ${task.title}`,
      link: { label: 'Open task', url: this.absoluteUrl(link) },
    });

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
    // Emails go out after the response, so publishing doesn't wait for every
    // student's email.
    for (const to of recipients) this.sendEmail(to, email);
  }

  /**
   * Notify every admin that a student submitted work for review. In-app only —
   * admins have no per-category email preferences in the current model.
   */
  async notifySubmissionReceived(params: {
    submissionId: number;
    /** When the student sent this version, so old Approve buttons can be told apart. */
    submittedAt: Date;
    studentName: string;
    taskTitle: string;
  }): Promise<void> {
    // First: a failed in-app notice must not skip the Slack post. Approve
    // opens a form in Slack for the feedback; Review opens the app.
    this.slack.postToMentors({
      text: `${params.studentName} submitted "${params.taskTitle}" for review`,
      link: {
        label: 'Review',
        url: this.absoluteUrl(ADMIN_ROUTES.REVIEWS),
      },
      action: {
        label: 'Approve',
        actionId: SLACK_ACTIONS.APPROVE_SUBMISSION,
        value: submissionKey(params.submissionId, params.submittedAt),
      },
    });
    await this.notifyAdmins({
      type: 'submission_received',
      title: 'New submission to review',
      body: `${params.studentName} submitted "${params.taskTitle}"`,
      link: ADMIN_ROUTES.REVIEWS,
    });
  }

  /** Notify every admin that a new application was submitted. */
  async notifyApplicationReceived(params: {
    applicantName: string;
  }): Promise<void> {
    this.slack.postToMentors({
      text: `New application from ${params.applicantName}`,
      link: {
        label: 'Open applications',
        url: this.absoluteUrl(ADMIN_ROUTES.APPLICATIONS),
      },
    });
    await this.notifyAdmins({
      type: 'application_received',
      title: 'New application received',
      body: `${params.applicantName} submitted an application`,
      link: ADMIN_ROUTES.APPLICATIONS,
    });
  }

  /** Notify every admin that a student is eligible for their monthly payment,
   *  and email the student that their stipend will arrive within 2 business days. */
  async notifyPaymentEligible(params: {
    studentName: string;
    studentId: number;
    studentEmail: string;
    /** Null when the student hasn't linked Slack. */
    studentSlackUserId: string | null;
    /** The month the tasks were due, such as "May 2026". */
    month: string;
  }): Promise<void> {
    this.slack.postToMentors({
      text: `${params.studentName} completed all tasks due in ${params.month} and is eligible for the stipend`,
      link: {
        label: 'Open student',
        url: this.absoluteUrl(ADMIN_ROUTES.USER(params.studentId)),
      },
    });
    // Like the stipend email, which has no switch: students always want to
    // know their stipend is coming.
    if (params.studentSlackUserId) {
      this.slack.postInBackground(params.studentSlackUserId, {
        text: `You completed all your tasks for ${params.month}. Great work! Your monthly stipend will be sent within 2 business days.`,
        link: {
          label: 'Open dashboard',
          url: this.absoluteUrl(STUDENT_ROUTES.DASHBOARD),
        },
      });
    }
    await this.notifyAdmins({
      type: 'payment_eligible',
      title: 'Student eligible for monthly payment',
      body: `${params.studentName} completed all tasks due in ${params.month}`,
      link: ADMIN_ROUTES.USER(params.studentId),
    });

    const url = this.absoluteUrl(STUDENT_ROUTES.DASHBOARD);
    this.sendEmail(
      params.studentEmail,
      paymentEligibleEmail({
        studentName: params.studentName,
        month: params.month,
        url,
      }),
    );
  }

  private async notifyAdmins(notification: {
    type: 'submission_received' | 'application_received' | 'payment_eligible';
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

  /**
   * Best-effort send after the response: a failed or slow email must never
   * break or hold up the triggering action.
   */
  private sendEmail(to: string, email: RenderedEmail): void {
    this.mail.sendInBackground({ to, ...email });
  }
}
