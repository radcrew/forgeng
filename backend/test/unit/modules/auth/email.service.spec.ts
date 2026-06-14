import { MailService } from '@core/mail';
import { EmailService } from '@modules/auth/services/email.service';

describe('EmailService', () => {
  let service: EmailService;
  let mail: { send: jest.Mock };

  beforeEach(() => {
    mail = { send: jest.fn().mockResolvedValue(undefined) };
    service = new EmailService(mail as unknown as MailService);
  });

  it('sends a verification email to the address with the verify URL', async () => {
    await service.sendVerificationEmail(
      'ada@example.com',
      'https://app/verify?token=x',
    );

    const [arg] = mail.send.mock.calls[0] as [
      { to: string; subject: string; text: string },
    ];
    expect(arg.to).toBe('ada@example.com');
    expect(arg.subject).toMatch(/verify/i);
    expect(arg.text).toContain('https://app/verify?token=x');
  });

  it('sends a password reset email to the address with the reset URL', async () => {
    await service.sendPasswordResetEmail(
      'ada@example.com',
      'https://app/reset?token=y',
    );

    const [arg] = mail.send.mock.calls[0] as [
      { to: string; subject: string; text: string },
    ];
    expect(arg.to).toBe('ada@example.com');
    expect(arg.subject).toMatch(/reset/i);
    expect(arg.text).toContain('https://app/reset?token=y');
  });
});
