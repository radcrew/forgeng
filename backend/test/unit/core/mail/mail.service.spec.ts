import { createTransport } from 'nodemailer';
import { MailService } from '@core/mail';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn(), close: jest.fn() })),
}));

const makeConfig = (smtp: unknown) =>
  ({
    get: () => smtp,
    getOrThrow: () => 'Forgeng <no-reply@example.com>',
  }) as never;

describe('MailService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reuses a few pooled connections with a rate limit', () => {
    new MailService(
      makeConfig({ host: 'smtp.example.com', port: 587, secure: false }),
    );

    // Publishing a task to a whole cohort must not open one connection per
    // student at the same moment.
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        pool: true,
        maxConnections: 3,
        rateDelta: 1000,
        rateLimit: 10,
      }),
    );
  });

  it('creates no transport when SMTP is not set', () => {
    new MailService(makeConfig(undefined));

    expect(createTransport).not.toHaveBeenCalled();
  });
});
