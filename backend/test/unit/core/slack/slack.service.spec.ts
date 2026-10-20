import { Logger } from '@nestjs/common';
import { waitUntil } from '@vercel/functions';
import {
  escapeSlackText,
  parseSubmissionKey,
  SlackService,
  submissionKey,
} from '@core/slack';

jest.mock('@vercel/functions', () => ({ waitUntil: jest.fn() }));

const answer = (status: number, body: unknown) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

const makeService = (
  slack: { botToken: string; mentorsChannelId: string | null } | null,
) => new SlackService({ get: () => slack } as never);

/** The promise the last post handed to waitUntil. */
const handed = () => {
  const calls = (waitUntil as jest.Mock).mock.calls as [Promise<void>][];
  return calls[calls.length - 1][0];
};

const SLACK = { botToken: 'xoxb-test', mentorsChannelId: 'CMENTORS' };

describe('SlackService', () => {
  let fetchMock: jest.Mock;
  let logError: jest.SpyInstance;
  const realFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    fetchMock = jest.fn().mockReturnValue(answer(200, { ok: true }));
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  const sentBody = () =>
    JSON.parse(
      (fetchMock.mock.calls[0] as [string, { body: string }])[1].body,
    ) as {
      channel: string;
      text: string;
      blocks: Array<{ type: string; elements?: Array<{ url: string }> }>;
    };

  it('posts to the channel with the bot token, after the response', async () => {
    makeService(SLACK).postInBackground('CCOHORT', { text: 'New task' });
    await handed();

    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toBe('https://slack.com/api/chat.postMessage');
    expect(init.headers.Authorization).toBe('Bearer xoxb-test');
    expect(sentBody()).toMatchObject({ channel: 'CCOHORT', text: 'New task' });
    expect(waitUntil).toHaveBeenCalledWith(expect.any(Promise));
  });

  it('adds a button that opens Forgeng', async () => {
    makeService(SLACK).postInBackground('CCOHORT', {
      text: 'New task',
      link: { label: 'Open task', url: 'https://app.example/student/tasks/5' },
    });
    await handed();

    expect(sentBody().blocks[1]).toMatchObject({
      type: 'actions',
      elements: [{ url: 'https://app.example/student/tasks/5' }],
    });
  });

  it('adds an action button next to the link', async () => {
    makeService(SLACK).postToMentors({
      text: 'New submission',
      link: { label: 'Review', url: 'https://app.example/admin/reviews' },
      action: { label: 'Approve', actionId: 'approve_submission', value: '9' },
    });
    await handed();

    expect(sentBody().blocks[1]).toMatchObject({
      type: 'actions',
      elements: [
        { url: 'https://app.example/admin/reviews' },
        { action_id: 'approve_submission', value: '9', style: 'primary' },
      ],
    });
  });

  it('escapes Slack codes in names and titles', async () => {
    makeService(SLACK).postToMentors({
      text: 'New application from <!channel> & co',
    });
    await handed();

    expect(sentBody().text).toBe(
      'New application from &lt;!channel&gt; &amp; co',
    );
  });

  it('posts to the mentors channel', async () => {
    makeService(SLACK).postToMentors({ text: 'New submission' });
    await handed();

    expect(sentBody().channel).toBe('CMENTORS');
  });

  it.each([
    ['Slack is not set up', null, 'CCOHORT'],
    ['no channel is given', SLACK, null],
  ])('posts nothing when %s', (_, slack, channel) => {
    makeService(slack).postInBackground(channel, { text: 'x' });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('posts nothing to mentors without a mentors channel', () => {
    makeService({ ...SLACK, mentorsChannelId: null }).postToMentors({
      text: 'x',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs Slack refusing the post instead of throwing', async () => {
    fetchMock.mockReturnValue(
      answer(200, { ok: false, error: 'not_in_channel' }),
    );

    makeService(SLACK).postInBackground('CCOHORT', { text: 'x' });
    await expect(handed()).resolves.toBeUndefined();

    expect(logError).toHaveBeenCalledWith(
      'Failed to post to Slack channel CCOHORT',
      expect.stringContaining('not_in_channel'),
    );
  });

  it('logs Slack not answering instead of throwing', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'));

    makeService(SLACK).postInBackground('CCOHORT', { text: 'x' });
    await expect(handed()).resolves.toBeUndefined();

    expect(logError).toHaveBeenCalled();
  });

  describe('inviteToChannel', () => {
    it('adds the member to the channel', async () => {
      await makeService(SLACK).inviteToChannel('CCOHORT', 'U0ADA');

      const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }];
      expect(url).toBe('https://slack.com/api/conversations.invite');
      expect(JSON.parse(init.body)).toEqual({
        channel: 'CCOHORT',
        users: 'U0ADA',
      });
    });

    it('counts someone already in the channel as done', async () => {
      fetchMock.mockReturnValue(
        answer(200, { ok: false, error: 'already_in_channel' }),
      );

      await expect(
        makeService(SLACK).inviteToChannel('CCOHORT', 'U0ADA'),
      ).resolves.toBeUndefined();
    });

    it('throws other Slack errors, so the caller can log them', async () => {
      fetchMock.mockReturnValue(
        answer(200, { ok: false, error: 'not_in_channel' }),
      );

      await expect(
        makeService(SLACK).inviteToChannel('CCOHORT', 'U0ADA'),
      ).rejects.toThrow('not_in_channel');
    });

    it('throws when Slack is not set up', async () => {
      await expect(
        makeService(null).inviteToChannel('CCOHORT', 'U0ADA'),
      ).rejects.toThrow('not set up');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('listChannelMembers', () => {
    it("follows Slack's pages until the list ends", async () => {
      fetchMock
        .mockReturnValueOnce(
          answer(200, {
            ok: true,
            members: ['U1', 'U2'],
            response_metadata: { next_cursor: 'page2' },
          }),
        )
        .mockReturnValueOnce(
          answer(200, {
            ok: true,
            members: ['U3'],
            response_metadata: { next_cursor: '' },
          }),
        );

      await expect(
        makeService(SLACK).listChannelMembers('CCOHORT'),
      ).resolves.toEqual(['U1', 'U2', 'U3']);

      // A read method: Slack ignores a JSON body here, so it is a form.
      const [, init] = fetchMock.mock.calls[1] as [
        string,
        { body: string; headers: Record<string, string> },
      ];
      expect(init.headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded',
      );
      const sent = new URLSearchParams(init.body);
      expect(sent.get('channel')).toBe('CCOHORT');
      expect(sent.get('cursor')).toBe('page2');
    });

    it('throws when Slack refuses, instead of returning a short list', async () => {
      fetchMock.mockReturnValue(
        answer(200, { ok: false, error: 'channel_not_found' }),
      );

      await expect(
        makeService(SLACK).listChannelMembers('CCOHORT'),
      ).rejects.toThrow('channel_not_found');
    });
  });

  describe('listWorkspaceMembers', () => {
    it("follows Slack's pages and sends a form", async () => {
      fetchMock
        .mockReturnValueOnce(
          answer(200, {
            ok: true,
            members: [{ id: 'U1', profile: { email: 'a@example.com' } }],
            response_metadata: { next_cursor: 'page2' },
          }),
        )
        .mockReturnValueOnce(
          answer(200, { ok: true, members: [{ id: 'U2', is_bot: true }] }),
        );

      await expect(makeService(SLACK).listWorkspaceMembers()).resolves.toEqual([
        { id: 'U1', profile: { email: 'a@example.com' } },
        { id: 'U2', is_bot: true },
      ]);

      const [url, init] = fetchMock.mock.calls[1] as [
        string,
        { body: string; headers: Record<string, string> },
      ];
      expect(url).toBe('https://slack.com/api/users.list');
      expect(init.headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded',
      );
      const sent = new URLSearchParams(init.body);
      expect(sent.get('limit')).toBe('200');
      expect(sent.get('cursor')).toBe('page2');
    });

    it('throws when Slack refuses, for example without the scope', async () => {
      fetchMock.mockReturnValue(
        answer(200, { ok: false, error: 'missing_scope' }),
      );

      await expect(makeService(SLACK).listWorkspaceMembers()).rejects.toThrow(
        'missing_scope',
      );
    });
  });

  describe('openView', () => {
    it('opens the form for the click that triggered it', async () => {
      await makeService(SLACK).openView('trigger-1', { type: 'modal' });

      const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }];
      expect(url).toBe('https://slack.com/api/views.open');
      expect(JSON.parse(init.body)).toEqual({
        trigger_id: 'trigger-1',
        view: { type: 'modal' },
      });
    });

    it('throws when Slack refuses, so the caller can log it', async () => {
      fetchMock.mockReturnValue(
        answer(200, { ok: false, error: 'expired_trigger_id' }),
      );

      await expect(
        makeService(SLACK).openView('trigger-1', { type: 'modal' }),
      ).rejects.toThrow('expired_trigger_id');
    });
  });

  describe('removeFromChannel', () => {
    it('removes the member from the channel', async () => {
      await makeService(SLACK).removeFromChannel('CCOHORT', 'U0ADA');

      const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }];
      expect(url).toBe('https://slack.com/api/conversations.kick');
      expect(JSON.parse(init.body)).toEqual({
        channel: 'CCOHORT',
        user: 'U0ADA',
      });
    });

    it('counts someone not in the channel as done', async () => {
      fetchMock.mockReturnValue(
        answer(200, { ok: false, error: 'not_in_channel' }),
      );

      await expect(
        makeService(SLACK).removeFromChannel('CCOHORT', 'U0ADA'),
      ).resolves.toBeUndefined();
    });
  });
});

describe('escapeSlackText', () => {
  it('escapes the three Slack code characters', () => {
    expect(escapeSlackText('a & b <@U123> c')).toBe(
      'a &amp; b &lt;@U123&gt; c',
    );
  });
});

describe('submissionKey', () => {
  it('names a submission and when it was sent, and reads back', () => {
    const key = submissionKey(9, new Date(1000));

    expect(key).toBe('9@1000');
    expect(parseSubmissionKey(key)).toEqual({ id: 9, sentAt: 1000 });
  });

  it.each(['9', 'abc', '9@', '@1000', '9@1000@1'])(
    'reads %p as no key',
    (key) => {
      expect(parseSubmissionKey(key)).toBeNull();
    },
  );
});
