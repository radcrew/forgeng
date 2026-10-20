import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/database/prisma.service';
import { SlackService } from '@core/slack';
import { FeedbackService } from '@modules/feedback/feedback.service';
import { SlackReviewsService } from '@modules/slack/slack-reviews.service';

const SUBMISSION = {
  status: 'submitted',
  task: { title: 'Build a CLI' },
  user: { name: 'Ada', email: 'ada@example.com' },
};

describe('SlackReviewsService', () => {
  let prisma: {
    user: { findUnique: jest.Mock };
    submission: { findUnique: jest.Mock };
  };
  let slack: { openView: jest.Mock };
  let feedback: { create: jest.Mock };
  let service: SlackReviewsService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: 'admin' }) },
      submission: { findUnique: jest.fn().mockResolvedValue(SUBMISSION) },
    };
    slack = { openView: jest.fn().mockResolvedValue(undefined) };
    feedback = { create: jest.fn().mockResolvedValue({ id: 1 }) };
    service = new SlackReviewsService(
      prisma as unknown as PrismaService,
      slack as unknown as SlackService,
      feedback as unknown as FeedbackService,
    );
  });

  const open = (submissionId = '9') =>
    service.openApproveForm({
      triggerId: 'trigger-1',
      slackUserId: 'U0MENTOR',
      submissionId,
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
      private_metadata: '9',
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

  it('does not look up a submission id that is not a number', async () => {
    await open('abc');

    expect(prisma.submission.findUnique).not.toHaveBeenCalled();
    expect(JSON.stringify(opened())).toContain('already reviewed');
  });

  describe('approveFromForm', () => {
    const MENTOR = { id: 1, role: 'admin', name: 'Grace' };

    const submit = (text: string | null = '  Great work on the CLI!  ') =>
      service.approveFromForm({
        slackUserId: 'U0MENTOR',
        submissionId: '9',
        values: { feedback: { feedback_input: { value: text } } },
      });

    /** The message the form shows under the feedback field. */
    const errorOf = (answer: unknown) =>
      (answer as { errors: { feedback: string } }).errors.feedback;

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(MENTOR);
    });

    it('saves the review as the mentor, then closes the form', async () => {
      await expect(submit()).resolves.toBeUndefined();

      expect(feedback.create).toHaveBeenCalledWith(9, MENTOR, {
        content: 'Great work on the CLI!',
        verdict: 'approved',
      });
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
      expect(feedback.create).not.toHaveBeenCalled();
    });

    it.each([null, '', '    '])(
      'asks for feedback when it is %p',
      async (text) => {
        const answer = await submit(text);

        expect(errorOf(answer)).toBe('Write some feedback for the student.');
        expect(feedback.create).not.toHaveBeenCalled();
      },
    );

    it('refuses feedback over 4000 characters', async () => {
      const answer = await submit('a'.repeat(4001));

      expect(errorOf(answer)).toMatch(/under 4000 characters/);
      expect(feedback.create).not.toHaveBeenCalled();
    });

    it.each([
      [
        'already reviewed',
        new ConflictException(),
        'This submission was already reviewed.',
      ],
      ['gone', new NotFoundException(), 'This submission no longer exists.'],
    ])(
      'says so in the form when the submission is %s',
      async (_, err, message) => {
        feedback.create.mockRejectedValue(err);

        expect(errorOf(await submit())).toBe(message);
      },
    );

    it('logs any other error and points to the app', async () => {
      const logError = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      feedback.create.mockRejectedValue(new Error('db down'));

      const answer = await submit();

      expect(errorOf(answer)).toMatch(/review this submission in Forgeng/);
      expect(logError).toHaveBeenCalled();
      logError.mockRestore();
    });
  });
});
