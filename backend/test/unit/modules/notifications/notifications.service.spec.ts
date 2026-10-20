import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@core/mail';
import { SlackService } from '@core/slack';
import { PrismaService } from '@core/database/prisma.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import type { AuthUser } from '@core/auth/auth.types';

const user: AuthUser = { id: 2, role: 'student' } as AuthUser;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
      createMany: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    notificationPreference: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
    user: { findUnique: jest.Mock; findMany: jest.Mock };
    enrollment: { findMany: jest.Mock };
    cohort: { findUnique: jest.Mock };
  };
  let mail: { sendInBackground: jest.Mock };
  let slack: { postInBackground: jest.Mock; postToMentors: jest.Mock };

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      notificationPreference: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
      },
      user: { findUnique: jest.fn(), findMany: jest.fn() },
      enrollment: { findMany: jest.fn() },
      cohort: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    // The mail and Slack services send in the background, so a slow or
    // failed send never holds up or fails the notice. Their own tests cover
    // that.
    mail = { sendInBackground: jest.fn() };
    slack = { postInBackground: jest.fn(), postToMentors: jest.fn() };
    const config = { get: jest.fn().mockReturnValue('https://app') };

    service = new NotificationsService(
      prisma as unknown as PrismaService,
      mail as unknown as MailService,
      config as unknown as ConfigService,
      slack as unknown as SlackService,
    );
  });

  describe('markRead', () => {
    it('hides another user notification as 404', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 1, userId: 999 });
      await expect(service.markRead(1, user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('marks an own unread notification read', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 1,
        userId: user.id,
        readAt: null,
      });
      prisma.notification.update.mockResolvedValue({
        id: 1,
        userId: user.id,
        readAt: new Date(),
        createdAt: new Date('2026-01-15T10:30:00.000Z'),
      });

      await service.markRead(1, user);

      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });
  });

  describe('delete', () => {
    it('hides another user notification as 404', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 1, userId: 999 });
      await expect(service.delete(1, user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });

    it('deletes an own notification', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 1,
        userId: user.id,
      });
      await service.delete(1, user);
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('notifyFeedbackReceived', () => {
    it('creates an in-app notification and emails by default', async () => {
      // No preference row -> all categories default to true.
      prisma.notificationPreference.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ email: 'ada@example.com' });

      await service.notifyFeedbackReceived({
        userId: 2,
        submissionId: 5,
        verdict: 'approved',
      });

      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mail.sendInBackground).toHaveBeenCalledTimes(1);
    });

    it('respects disabled in-app and email preferences', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 2,
        feedbackInApp: false,
        feedbackEmail: false,
        taskInApp: true,
        taskEmail: true,
      });
      prisma.user.findUnique.mockResolvedValue({ email: 'ada@example.com' });

      await service.notifyFeedbackReceived({
        userId: 2,
        submissionId: 5,
        verdict: 'needs_work',
      });

      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(mail.sendInBackground).not.toHaveBeenCalled();
    });
  });

  describe('notifyTaskPublished', () => {
    it('does nothing when the cohort has no enrollments', async () => {
      prisma.enrollment.findMany.mockResolvedValue([]);

      await service.notifyTaskPublished({ id: 5, cohortId: 3, title: 'CLI' });

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
      expect(mail.sendInBackground).not.toHaveBeenCalled();
    });

    it('notifies enrolled students in-app and by email by default', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        { userId: 2, user: { email: 'a@example.com' } },
        { userId: 3, user: { email: 'b@example.com' } },
      ]);
      prisma.notificationPreference.findMany.mockResolvedValue([]);

      await service.notifyTaskPublished({ id: 5, cohortId: 3, title: 'CLI' });

      expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
      expect(mail.sendInBackground).toHaveBeenCalledTimes(2);
    });
  });

  describe('notifySubmissionReceived', () => {
    it('creates an in-app notification for every admin', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }]);

      await service.notifySubmissionReceived({
        studentName: 'Ada',
        taskTitle: 'CLI',
      });

      const [arg] = prisma.notification.createMany.mock.calls[0] as [
        { data: unknown[] },
      ];
      expect(arg.data).toHaveLength(2);
    });

    it('does nothing when there are no admins', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await service.notifySubmissionReceived({
        studentName: 'Ada',
        taskTitle: 'CLI',
      });
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });

  describe('notifyPaymentEligible', () => {
    it('notifies admins and emails the student', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 10 }]);

      await service.notifyPaymentEligible({
        studentName: 'Ada',
        studentId: 2,
        studentEmail: 'ada@example.com',
        month: 'May 2026',
      });

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            body: 'Ada completed all tasks due in May 2026',
          }),
        ],
      });
      expect(mail.sendInBackground).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ada@example.com' }),
      );
    });
  });

  describe('Slack posts', () => {
    it("posts a new task to the cohort's channel, with a link", async () => {
      prisma.cohort.findUnique.mockResolvedValue({
        slackChannelId: 'C0123ABCD',
      });
      prisma.enrollment.findMany.mockResolvedValue([]);

      await service.notifyTaskPublished({ id: 5, cohortId: 3, title: 'CLI' });

      // Even with nobody enrolled yet.
      expect(slack.postInBackground).toHaveBeenCalledWith('C0123ABCD', {
        text: 'New task: CLI',
        link: { label: 'Open task', url: 'https://app/student/tasks/5' },
      });
    });

    it('hands no channel over for a cohort without one', async () => {
      prisma.cohort.findUnique.mockResolvedValue({ slackChannelId: null });
      prisma.enrollment.findMany.mockResolvedValue([]);

      await service.notifyTaskPublished({ id: 5, cohortId: 3, title: 'CLI' });

      // The Slack service posts nothing without a channel.
      expect(slack.postInBackground).toHaveBeenCalledWith(
        null,
        expect.anything(),
      );
    });

    it('tells the mentors about a new application', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.notifyApplicationReceived({ applicantName: 'Ada' });

      expect(slack.postToMentors).toHaveBeenCalledWith({
        text: 'New application from Ada',
        link: {
          label: 'Open applications',
          url: 'https://app/admin/applications',
        },
      });
    });

    it('tells the mentors about a new submission', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.notifySubmissionReceived({
        studentName: 'Ada',
        taskTitle: 'CLI',
      });

      expect(slack.postToMentors).toHaveBeenCalledWith({
        text: 'Ada submitted "CLI" for review',
        link: { label: 'Review', url: 'https://app/admin/reviews' },
      });
    });

    it('tells the mentors a student is eligible for the stipend', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.notifyPaymentEligible({
        studentName: 'Ada',
        studentId: 2,
        studentEmail: 'ada@example.com',
        month: 'May 2026',
      });

      expect(slack.postToMentors).toHaveBeenCalledWith({
        text: 'Ada completed all tasks due in May 2026 and is eligible for the stipend',
        link: { label: 'Open student', url: 'https://app/admin/users/2' },
      });
    });

    describe('direct messages to the student', () => {
      const feedback = (verdict: 'approved' | 'needs_work' = 'approved') =>
        service.notifyFeedbackReceived({ userId: 2, submissionId: 5, verdict });

      beforeEach(() => {
        prisma.notificationPreference.findUnique.mockResolvedValue(null);
        prisma.user.findUnique.mockResolvedValue({
          email: 'ada@example.com',
          slackUserId: 'U0ADA',
        });
      });

      it('sends an approved review to the student in Slack', async () => {
        await feedback('approved');

        expect(slack.postInBackground).toHaveBeenCalledWith('U0ADA', {
          text: 'A reviewer approved your submission. Great work!',
          link: {
            label: 'Open submissions',
            url: 'https://app/student/submissions',
          },
        });
      });

      it('says when changes were asked for', async () => {
        await feedback('needs_work');

        expect(slack.postInBackground).toHaveBeenCalledWith(
          'U0ADA',
          expect.objectContaining({
            text: expect.stringContaining('asked for changes') as unknown,
          }),
        );
      });

      it('sends nothing when the student turned Slack messages off', async () => {
        prisma.notificationPreference.findUnique.mockResolvedValue({
          feedbackInApp: true,
          feedbackEmail: true,
          feedbackSlack: false,
          taskInApp: true,
          taskEmail: true,
        });

        await feedback();

        expect(slack.postInBackground).not.toHaveBeenCalled();
      });

      it("sends nothing to a student who hasn't joined Slack", async () => {
        prisma.user.findUnique.mockResolvedValue({
          email: 'ada@example.com',
          slackUserId: null,
        });

        await feedback();

        expect(slack.postInBackground).not.toHaveBeenCalled();
      });

      it('still sends the Slack message when the in-app notice fails', async () => {
        prisma.notification.create.mockRejectedValue(new Error('db down'));

        await expect(feedback()).rejects.toThrow('db down');
        expect(slack.postInBackground).toHaveBeenCalledTimes(1);
      });

      it('tells the student in Slack that the stipend is coming', async () => {
        prisma.user.findUnique.mockResolvedValue({ slackUserId: 'U0ADA' });
        prisma.user.findMany.mockResolvedValue([]);

        await service.notifyPaymentEligible({
          studentName: 'Ada',
          studentId: 2,
          studentEmail: 'ada@example.com',
          month: 'May 2026',
        });

        expect(prisma.user.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 2 } }),
        );
        expect(slack.postInBackground).toHaveBeenCalledWith('U0ADA', {
          text: 'You completed all your tasks for May 2026. Great work! Your monthly stipend will be sent within 2 business days.',
          link: { label: 'Open dashboard', url: 'https://app/student' },
        });
      });
    });

    it('still posts to Slack when the in-app notice fails', async () => {
      prisma.user.findMany.mockRejectedValue(new Error('db down'));

      await expect(
        service.notifySubmissionReceived({
          studentName: 'Ada',
          taskTitle: 'CLI',
        }),
      ).rejects.toThrow('db down');

      expect(slack.postToMentors).toHaveBeenCalledTimes(1);
    });
  });
});
