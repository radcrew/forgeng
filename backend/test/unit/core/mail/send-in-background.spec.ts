import { Logger } from '@nestjs/common';
import { waitUntil } from '@vercel/functions';
import { MailService, sendInBackground } from '@core/mail';

jest.mock('@vercel/functions', () => ({ waitUntil: jest.fn() }));

describe('sendInBackground', () => {
  const email = { to: 'ada@example.com', subject: 'Hi', text: 'Hello' };
  let logger: { error: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    logger = { error: jest.fn() };
  });

  it('starts the send and hands it to waitUntil without waiting', () => {
    const mail = { send: jest.fn(() => new Promise<void>(() => undefined)) };

    // Returns at once, although the mail server never answers.
    sendInBackground(
      mail as unknown as MailService,
      email,
      logger as unknown as Logger,
    );

    expect(mail.send).toHaveBeenCalledWith(email);
    expect(waitUntil).toHaveBeenCalledWith(expect.any(Promise));
  });

  it('logs a failed send instead of rejecting', async () => {
    const mail = { send: jest.fn().mockRejectedValue(new Error('smtp down')) };

    sendInBackground(
      mail as unknown as MailService,
      email,
      logger as unknown as Logger,
    );
    // The promise handed to waitUntil must settle without an error.
    const [[handed]] = (waitUntil as jest.Mock).mock.calls as [[Promise<void>]];
    await expect(handed).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to send "Hi" to ada@example.com',
      expect.any(String),
    );
  });
});
