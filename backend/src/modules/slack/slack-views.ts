import { escapeSlackText, SLACK_ACTIONS } from '../../core/slack';

/** The feedback field in the approve form, as Slack names it in answers. */
export const FEEDBACK_BLOCK = 'feedback';
export const FEEDBACK_INPUT = 'feedback_input';
/** The same limit as the review form in the app. */
export const FEEDBACK_MAX = 4000;
/** How much of the student's note the form shows. Slack allows 3000. */
const NOTE_PREVIEW = 1000;

/**
 * The form a mentor fills in after clicking Approve. It shows the student's
 * work, so the mentor sees what they approve. Slack sends it back with the
 * `submissionKey` in `private_metadata`.
 */
export function approveFormView(params: {
  submissionKey: string;
  studentName: string;
  taskTitle: string;
  repoUrl: string | null;
  note: string | null;
}): object {
  const note = params.note?.trim();
  const work = [
    params.repoUrl ? `*Repository:* ${escapeSlackText(params.repoUrl)}` : '',
    note
      ? `*Note:*\n${escapeSlackText(
          note.length > NOTE_PREVIEW
            ? `${note.slice(0, NOTE_PREVIEW)}… (open Forgeng to read the rest)`
            : note,
        )}`
      : '',
  ].filter(Boolean);

  return {
    type: 'modal',
    callback_id: SLACK_ACTIONS.APPROVE_SUBMISSION,
    private_metadata: params.submissionKey,
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
      ...(work.length
        ? [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: work.join('\n\n') },
            },
          ]
        : []),
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
