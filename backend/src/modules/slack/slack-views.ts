import { escapeSlackText, SLACK_ACTIONS } from '../../core/slack';

/** The feedback field in the approve form, as Slack names it in answers. */
export const FEEDBACK_BLOCK = 'feedback';
export const FEEDBACK_INPUT = 'feedback_input';
/**
 * Slack's largest limit for a text field. The review form in the app allows
 * 4000, but Slack refuses to open a form whose field asks for more.
 */
export const FEEDBACK_MAX = 3000;
/** How much of the student's note the form shows. */
const NOTE_PREVIEW = 1000;
/** Slack refuses a form whose section text is longer than this. */
const SECTION_MAX = 3000;
const CUT = '… (open Forgeng to read the rest)';

/**
 * Escapes text for Slack, then shortens it so it keeps at most `maxChars`
 * of its characters and is at most `maxLength` long once escaped. It counts
 * after escaping, since escaping makes text longer ("<" becomes "&lt;"), and
 * never cuts an escaped character in half.
 */
function fitEscaped(text: string, maxChars: number, maxLength: number): string {
  const chars = [...text];
  const full = escapeSlackText(text);
  if (chars.length <= maxChars && full.length <= maxLength) return full;

  let out = '';
  for (const ch of chars.slice(0, maxChars)) {
    const escaped = escapeSlackText(ch);
    if (out.length + escaped.length > maxLength - CUT.length) break;
    out += escaped;
  }
  return out + CUT;
}

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
  const repoLabel = '*Repository:* ';
  const noteLabel = '*Note:*\n';
  // One section each, so each one stays within Slack's limit.
  const work = [
    params.repoUrl
      ? repoLabel +
        fitEscaped(params.repoUrl, Infinity, SECTION_MAX - repoLabel.length)
      : '',
    note
      ? noteLabel +
        fitEscaped(note, NOTE_PREVIEW, SECTION_MAX - noteLabel.length)
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
      ...work.map((text) => ({
        type: 'section',
        text: { type: 'mrkdwn', text },
      })),
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
