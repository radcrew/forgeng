import { UnauthorizedException } from '@nestjs/common';
import { MailService } from '@core/mail';
import { EmailRetryController } from '@core/mail/email-retry.controller';

describe('EmailRetryController', () => {
  let mail: { retryFailed: jest.Mock };

  const makeController = (cronSecret: string | undefined) =>
    new EmailRetryController(
      mail as unknown as MailService,
      { get: () => cronSecret } as never,
    );

  beforeEach(() => {
    mail = {
      retryFailed: jest.fn().mockResolvedValue({ retried: 2, sent: 2 }),
    };
  });

  it('retries the emails for the Vercel Cron secret', async () => {
    await expect(
      makeController('s3cret').retryEmails('Bearer s3cret'),
    ).resolves.toEqual({ retried: 2, sent: 2 });
  });

  it.each([
    ['no header', undefined],
    ['a wrong secret', 'Bearer nope'],
  ])('refuses a call with %s', (_, header) => {
    expect(() => makeController('s3cret').retryEmails(header)).toThrow(
      UnauthorizedException,
    );
    expect(mail.retryFailed).not.toHaveBeenCalled();
  });

  it('refuses every call when no secret is set', () => {
    // Otherwise "Bearer undefined" would open the route to anyone.
    expect(() =>
      makeController(undefined).retryEmails('Bearer undefined'),
    ).toThrow(UnauthorizedException);
  });
});
