import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/database/prisma.service';
import { SlackService } from '@core/slack';
import { waitUntil } from '@vercel/functions';
import { FeedbackService } from '@modules/feedback/feedback.service';
import { SlackReviewsService } from '@modules/slack/slack-reviews.service';

jest.mock('@vercel/functions', () => ({ waitUntil: jest.fn() }));

const SUBMISSION = {
  status: 'submitted',
  lastSubmittedAt: new Date(1000),
  content: 'I used commander for the flags.',
  repoUrl: 'https://github.com/ada/cli',
  task: { title: 'Build a CLI' },
  user: { name: 'Ada', email: 'ada@example.com' },
};

describe('SlackReviewsService', () => {
  let prisma: {
    user: { findUnique: jest.Mock };
    submission: { findUnique: jest.Mock };
  };
  let slack: { openView: jest.Mock; postInBackground: jest.Mock };
  let feedback: { create: jest.Mock };
  let service: SlackReviewsService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: 'admin' }) },
      submission: { findUnique: jest.fn().mockResolvedValue(SUBMISSION) },
    };
    slack = {
      openView: jest.fn().mockResolvedValue(undefined),
      postInBackground: jest.fn(),
    };
    feedback = { create: jest.fn().mockResolvedValue({ id: 1 }) };
    service = new SlackReviewsService(
      prisma as unknown as PrismaService,
      slack as unknown as SlackService,
      feedback as unknown as FeedbackService,
    );
  });

  const open = (submissionKey = '9@1000') =>
    service.openApproveForm({
      triggerId: 'trigger-1',
      slackUserId: 'U0MENTOR',
      submissionKey,
    });

  /** The view handed to Slack. */
  const opened = () =>
    (slack.openView.mock.calls[0] as [string, Record<string, unknown>])[1];

  it('opens the feedback form for a mentor, with the submission id', async () => {
    await open();

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slackUserId: 'U0MENTOR' } }),
    );
    expect(slack.openView).toHaveBeenCalledWith('trigger-1', expect.anything());
    expect(opened()).toMatchObject({
      type: 'modal',
      callback_id: 'approve_submission',
      private_metadata: '9@1000',
      submit: { text: 'Approve' },
    });
    expect(JSON.stringify(opened())).toContain('Ada submitted');
  });

  it('escapes names in the form', async () => {
    prisma.submission.findUnique.mockResolvedValue({
      ...SUBMISSION,
      user: { name: '<!channel>', email: 'x@example.com' },
    });

    await open();

    expect(JSON.stringify(opened())).toContain('&lt;!channel&gt;');
  });

  it.each([
    ['someone not linked to Forgeng', null],
    ['a student', { role: 'student' }],
  ])('only shows a message to %s', async (_, user) => {
    prisma.user.findUnique.mockResolvedValue(user);

    await open();

    expect(opened()).not.toHaveProperty('submit');
    expect(JSON.stringify(opened())).toContain('Only Forgeng mentors');
    expect(prisma.submission.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ['already reviewed', { ...SUBMISSION, status: 'approved' }],
    ['gone', null],
  ])('only shows a message for a submission that is %s', async (_, sub) => {
    prisma.submission.findUnique.mockResolvedValue(sub);

    await open();

    expect(opened()).not.toHaveProperty('submit');
    expect(JSON.stringify(opened())).toContain('already reviewed');
  });

  it.each(['abc', '9'])(
    'does not look up a submission for the key %p',
    async (key) => {
      await open(key);

      expect(prisma.submission.findUnique).not.toHaveBeenCalled();
      expect(JSON.stringify(opened())).toContain('already reviewed');
    },
  );

  it('shows the student work in the form', async () => {
    await open();

    const form = JSON.stringify(opened());
    expect(form).toContain('https://github.com/ada/cli');
    expect(form).toContain('I used commander for the flags.');
  });

  it('shortens a long note in the form', async () => {
    prisma.submission.findUnique.mockResolvedValue({
      ...SUBMISSION,
      content: 'a'.repeat(1500),
    });

    await open();

    const form = JSON.stringify(opened());
    expect(form).not.toContain('a'.repeat(1001));
    expect(form).toContain('open Forgeng to read the rest');
  });

  /** The text of every section in the opened form. */
  const sectionTexts = () =>
    (
      opened() as { blocks: Array<{ type: string; text?: { text: string } }> }
    ).blocks
      .filter((b) => b.type === 'section')
      .map((b) => b.text?.text ?? '');

  it("keeps a note full of escaped characters within Slack's limit", async () => {
    // Each "&" becomes "&amp;" (5 characters), so 1000 of them would be 5000.
    prisma.submission.findUnique.mockResolvedValue({
      ...SUBMISSION,
      content: '&'.repeat(1500),
      repoUrl: `https://github.com/ada/cli?${'&x'.repeat(1400)}`,
    });

    await open();

    for (const text of sectionTexts()) {
      expect(text.length).toBeLessThanOrEqual(3000);
    }
    const note = sectionTexts().find((t) => t.startsWith('*Note:*'));
    // Cut between escaped characters, never inside one.
    expect(note).toMatch(/^\*Note:\*\n(&amp;)+… \(open Forgeng/);
  });

  it('shows a short note whole, without the cut message', async () => {
    prisma.submission.findUnique.mockResolvedValue({
      ...SUBMISSION,
      content: 'Uses <Flag> & more',
    });

    await open();

    expect(sectionTexts()).toContain('*Note:*\nUses &lt;Flag&gt; &amp; more');
  });

  it('refuses a button from before the student sent new work', async () => {
    prisma.submission.findUnique.mockResolvedValue({
      ...SUBMISSION,
      lastSubmittedAt: new Date(2000),
    });

    await open('9@1000');

    expect(opened()).not.toHaveProperty('submit');
    expect(JSON.stringify(opened())).toContain('sent new work');
  });

  describe('approveFromForm', () => {
    const MENTOR = { id: 1, role: 'admin', name: 'Grace' };

    const submit = (text: string | null = '  Great work on the CLI!  ') =>
      service.approveFromForm({
        slackUserId: 'U0MENTOR',
        submissionKey: '9@1000',
        values: { feedback: { feedback_input: { value: text } } },
      });

    /** The message the form shows under the feedback field. */
    const errorOf = (answer: unknown) =>
      (answer as { errors: { feedback: string } }).errors.feedback;

    /** Waits for the save that runs after the form has closed. */
    const saved = () => {
      const calls = (waitUntil as jest.Mock).mock.calls as [Promise<void>][];
      return calls[calls.length - 1][0];
    };

    /** The message sent to the mentor when the save fails. */
    const toldMentor = () =>
      (slack.postInBackground.mock.calls[0] as [string, { text: string }])[1]
        .text;

    beforeEach(() => {
      (waitUntil as jest.Mock).mockClear();
      prisma.user.findUnique.mockResolvedValue(MENTOR);
    });

    it('closes the form first, then saves the review as the mentor', async () => {
      await expect(submit()).resolves.toBeUndefined();
      await saved();

      // Only for the version of the work the mentor saw.
      expect(feedback.create).toHaveBeenCalledWith(
        9,
        MENTOR,
        { content: 'Great work on the CLI!', verdict: 'approved' },
        new Date(1000),
      );
      expect(slack.postInBackground).not.toHaveBeenCalled();
    });

    it.each([
      ['someone not linked to Forgeng', null],
      ['someone who is no longer an admin', { ...MENTOR, role: 'student' }],
    ])('refuses %s', async (_, user) => {
      prisma.user.findUnique.mockResolvedValue(user);

      const answer = await submit();

      expect(errorOf(answer)).toBe(
        'Only Forgeng mentors can approve submissions.',
      );
      expect(waitUntil).not.toHaveBeenCalled();
    });

    it.each([null, '', '    '])(
      'asks for feedback when it is %p',
      async (text) => {
        const answer = await submit(text);

        expect(errorOf(answer)).toBe('Write some feedback for the student.');
        expect(waitUntil).not.toHaveBeenCalled();
      },
    );

    it('refuses feedback over 3000 characters', async () => {
      const answer = await submit('a'.repeat(3001));

      expect(errorOf(answer)).toMatch(/under 3000 characters/);
      expect(waitUntil).not.toHaveBeenCalled();
    });

    it.each([
      [
        'already reviewed',
        { ...SUBMISSION, status: 'approved' },
        'This submission was already reviewed.',
      ],
      ['gone', null, 'This submission no longer exists.'],
    ])(
      'keeps the form open when the submission is %s',
      async (_, sub, message) => {
        prisma.submission.findUnique.mockResolvedValue(sub);

        expect(errorOf(await submit())).toBe(message);
        expect(waitUntil).not.toHaveBeenCalled();
      },
    );

    it('keeps the form open when the student sent new work meanwhile', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...SUBMISSION,
        lastSubmittedAt: new Date(2000),
      });

      expect(errorOf(await submit())).toMatch(/sent new work/);
      expect(waitUntil).not.toHaveBeenCalled();
    });

    it.each([
      [
        'another mentor was faster',
        new ConflictException(),
        'Another mentor reviewed this submission first, or the student sent new work.',
      ],
      [
        'the submission was deleted',
        new NotFoundException(),
        'This submission no longer exists.',
      ],
    ])(
      'tells the mentor in Slack, with their feedback, when %s',
      async (_, err, problem) => {
        feedback.create.mockRejectedValue(err);

        await submit();
        await saved();

        expect(slack.postInBackground).toHaveBeenCalledWith(
          'U0MENTOR',
          expect.anything(),
        );
        expect(toldMentor()).toContain(problem);
        expect(toldMentor()).toContain('Great work on the CLI!');
      },
    );

    it('logs any other error and points the mentor to the app', async () => {
      const logError = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      feedback.create.mockRejectedValue(new Error('db down'));

      await submit();
      await saved();

      expect(toldMentor()).toMatch(/review this submission in Forgeng/);
      expect(logError).toHaveBeenCalled();
      logError.mockRestore();
    });
  });
});
