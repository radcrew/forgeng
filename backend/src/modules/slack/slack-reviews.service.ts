import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { waitUntil } from '@vercel/functions';

import { PrismaService } from '../../core/database/prisma.service';
import { parseSubmissionKey, SlackService } from '../../core/slack';
import { FeedbackService } from '../feedback/feedback.service';
import {
  FEEDBACK_BLOCK,
  FEEDBACK_INPUT,
  FEEDBACK_MAX,
  approveFormView,
  infoView,
} from './slack-views';

/**
 * Slack's answer that keeps the form open and shows a message under the
 * feedback field. Undefined closes the form.
 */
export type FormAnswer =
  | { response_action: 'errors'; errors: Record<string, string> }
  | undefined;

const formError = (message: string): FormAnswer => ({
  response_action: 'errors',
  errors: { [FEEDBACK_BLOCK]: message },
});

/** Reviews that mentors start from buttons in Slack. */
@Injectable()
export class SlackReviewsService {
  private readonly logger = new Logger(SlackReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slack: SlackService,
    private readonly feedback: FeedbackService,
  ) {}

  /**
   * After the approve form is submitted: checks it, closes it, then saves
   * the review as the mentor who sent it, through the same service as the
   * app, so the same rules apply and the student is told the same way.
   *
   * Slack waits only 3 seconds for this answer, and saving also notifies
   * the student and runs the stipend check. So the quick checks show their
   * problems in the form, and the save runs after the answer.
   */
  async approveFromForm(params: {
    slackUserId: string;
    submissionKey: string;
    /** The form's values, as Slack sends them. */
    values: Record<string, Record<string, { value?: string | null }>>;
  }): Promise<FormAnswer> {
    // Checked again here: someone could lose the admin role while the form
    // is open, and Slack's form is not proof of who may approve.
    const mentor = await this.prisma.user.findUnique({
      where: { slackUserId: params.slackUserId },
    });
    if (mentor?.role !== 'admin') {
      return formError('Only Forgeng mentors can approve submissions.');
    }

    const content =
      params.values[FEEDBACK_BLOCK]?.[FEEDBACK_INPUT]?.value?.trim() ?? '';
    if (!content) return formError('Write some feedback for the student.');
    if (content.length > FEEDBACK_MAX) {
      return formError(`Keep the feedback under ${FEEDBACK_MAX} characters.`);
    }

    const sent = parseSubmissionKey(params.submissionKey);
    const submission = sent
      ? await this.prisma.submission.findUnique({
          where: { id: sent.id },
          select: { status: true, lastSubmittedAt: true },
        })
      : null;
    if (!sent || !submission) {
      return formError('This submission no longer exists.');
    }
    // For example another mentor approved it while this form was open.
    if (submission.status !== 'submitted') {
      return formError('This submission was already reviewed.');
    }
    if (submission.lastSubmittedAt.getTime() !== sent.sentAt) {
      return formError(
        'The student sent new work after this message. Close this form and use the newest message.',
      );
    }

    waitUntil(this.saveApproval(sent.id, mentor, params.slackUserId, content));
    return undefined;
  }

  /**
   * Saves the review after the form has closed. A problem now can't be shown
   * in the form, so the mentor gets a Slack message with their feedback, so
   * it isn't lost. Never throws.
   */
  private async saveApproval(
    submissionId: number,
    mentor: Parameters<FeedbackService['create']>[1],
    slackUserId: string,
    content: string,
  ): Promise<void> {
    try {
      await this.feedback.create(submissionId, mentor, {
        content,
        verdict: 'approved',
      });
      return;
    } catch (err) {
      let problem: string;
      if (err instanceof ConflictException) {
        // Another mentor approved it in the same moment.
        problem = 'Another mentor reviewed this submission first.';
      } else if (err instanceof NotFoundException) {
        problem = 'This submission no longer exists.';
      } else {
        this.logger.error(
          `Failed to save a review from Slack for submission ${submissionId}`,
          err instanceof Error ? err.stack : String(err),
        );
        problem =
          'Something went wrong. Please review this submission in Forgeng.';
      }
      this.slack.postInBackground(slackUserId, {
        text: `Your approval was not saved. ${problem}\n\nYour feedback:\n${content}`,
      });
    }
  }

  /**
   * After a click on Approve: opens the feedback form, or a short message
   * when the person can't approve this submission.
   */
  async openApproveForm(params: {
    triggerId: string;
    slackUserId: string;
    submissionKey: string;
  }): Promise<void> {
    const view = await this.approveView(
      params.slackUserId,
      params.submissionKey,
    );
    await this.slack.openView(params.triggerId, view);
  }

  private async approveView(slackUserId: string, key: string): Promise<object> {
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

    const sent = parseSubmissionKey(key);
    const submission = sent
      ? await this.prisma.submission.findUnique({
          where: { id: sent.id },
          select: {
            status: true,
            lastSubmittedAt: true,
            content: true,
            repoUrl: true,
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
    // A button from before the student sent their work again.
    if (submission.lastSubmittedAt.getTime() !== sent?.sentAt) {
      return infoView(
        'The student sent new work after this message. Use the newest message in this channel, so you approve the latest work.',
      );
    }

    return approveFormView({
      submissionKey: key,
      studentName: submission.user.name ?? submission.user.email,
      taskTitle: submission.task.title,
      repoUrl: submission.repoUrl,
      note: submission.content,
    });
  }
}
