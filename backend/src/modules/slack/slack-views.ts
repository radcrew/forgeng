import { escapeSlackText, SLACK_ACTIONS } from '../../core/slack';

/** The feedback field in the approve form, as Slack names it in answers. */
export const FEEDBACK_BLOCK = 'feedback';
export const FEEDBACK_INPUT = 'feedback_input';
/** The same limit as the review form in the app. */
export const FEEDBACK_MAX = 4000;

/**
 * The form a mentor fills in after clicking Approve. Slack sends it back
 * with the submission id in `private_metadata`.
 */
export function approveFormView(params: {
  submissionId: number;
  studentName: string;
  taskTitle: string;
}): object {
  return {
    type: 'modal',
    callback_id: SLACK_ACTIONS.APPROVE_SUBMISSION,
    private_metadata: String(params.submissionId),
    title: { type: 'plain_text', text: 'Approve submission' },
    submit: { type: 'plain_text', text: 'Approve' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: escapeSlackText(
            `${params.studentName} submitted "${params.taskTitle}".`,
          ),
        },
      },
      {
        type: 'input',
        block_id: FEEDBACK_BLOCK,
        label: { type: 'plain_text', text: 'Feedback for the student' },
        element: {
          type: 'plain_text_input',
          action_id: FEEDBACK_INPUT,
          multiline: true,
          max_length: FEEDBACK_MAX,
          placeholder: {
            type: 'plain_text',
            text: 'What did they do well? The student sees this.',
          },
        },
      },
    ],
  };
}

/** A form with only a message, for when the mentor can't approve. */
export function infoView(message: string): object {
  return {
    type: 'modal',
    title: { type: 'plain_text', text: 'Approve submission' },
    close: { type: 'plain_text', text: 'Close' },
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: escapeSlackText(message) },
      },
    ],
  };
}
