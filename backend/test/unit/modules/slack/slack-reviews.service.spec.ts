import { PrismaService } from '@core/database/prisma.service';
import { SlackService } from '@core/slack';
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
  let service: SlackReviewsService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: 'admin' }) },
      submission: { findUnique: jest.fn().mockResolvedValue(SUBMISSION) },
    };
    slack = { openView: jest.fn().mockResolvedValue(undefined) };
    service = new SlackReviewsService(
      prisma as unknown as PrismaService,
      slack as unknown as SlackService,
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
});
