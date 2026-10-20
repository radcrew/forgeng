import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma.service';
import { SlackService } from '../../core/slack';
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
   * After the approve form is submitted: saves the review as the mentor who
   * sent it, through the same service as the app, so the same rules apply
   * and the student is told the same way. Problems are shown in the form.
   */
  async approveFromForm(params: {
    slackUserId: string;
    submissionId: string;
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

    const submissionId = Number(params.submissionId);
    if (!Number.isInteger(submissionId)) {
      return formError('This submission no longer exists.');
    }

    try {
      await this.feedback.create(submissionId, mentor, {
        content,
        verdict: 'approved',
      });
      return undefined;
    } catch (err) {
      // For example another mentor approved it while this form was open.
      if (err instanceof ConflictException) {
        return formError('This submission was already reviewed.');
      }
      if (err instanceof NotFoundException) {
        return formError('This submission no longer exists.');
      }
      this.logger.error(
        `Failed to save a review from Slack for submission ${submissionId}`,
        err instanceof Error ? err.stack : String(err),
      );
      return formError(
        'Something went wrong. Please review this submission in Forgeng.',
      );
    }
  }

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
