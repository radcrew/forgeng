import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma.service';
import { SlackService } from '../../core/slack';
import { approveFormView, infoView } from './slack-views';

/** Reviews that mentors start from buttons in Slack. */
@Injectable()
export class SlackReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slack: SlackService,
  ) {}

  /**
   * After a click on Approve: opens the feedback form, or a short message
   * when the person can't approve this submission.
   */
  async openApproveForm(params: {
    triggerId: string;
    slackUserId: string;
    submissionId: string;
  }): Promise<void> {
    const view = await this.approveView(
      params.slackUserId,
      params.submissionId,
    );
    await this.slack.openView(params.triggerId, view);
  }

  private async approveView(
    slackUserId: string,
    rawSubmissionId: string,
  ): Promise<object> {
    // Only a Forgeng admin, linked by joining Slack with their Forgeng email.
    const mentor = await this.prisma.user.findUnique({
      where: { slackUserId },
      select: { role: true },
    });
    if (mentor?.role !== 'admin') {
      return infoView(
        'Only Forgeng mentors can approve submissions. If you are one, make sure your Slack account uses the same email as your Forgeng account.',
      );
    }

    const submissionId = Number(rawSubmissionId);
    const submission = Number.isInteger(submissionId)
      ? await this.prisma.submission.findUnique({
          where: { id: submissionId },
          select: {
            status: true,
            task: { select: { title: true } },
            user: { select: { name: true, email: true } },
          },
        })
      : null;
    // Already reviewed, for example in the app or by another mentor.
    if (submission?.status !== 'submitted') {
      return infoView(
        'This submission was already reviewed, or it no longer exists.',
      );
    }

    return approveFormView({
      submissionId,
      studentName: submission.user.name ?? submission.user.email,
      taskTitle: submission.task.title,
    });
  }
}
