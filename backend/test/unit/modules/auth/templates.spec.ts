import { passwordResetEmail, verificationEmail } from '@modules/auth/templates';

describe('auth email templates', () => {
  describe('verificationEmail', () => {
    const url = 'https://app/verify?token=abc';
    const email = verificationEmail(url);

    it('has a verification subject', () => {
      expect(email.subject).toMatch(/verify/i);
    });

    it('embeds the verify URL in both text and html bodies', () => {
      expect(email.text).toContain(url);
      expect(email.html).toContain(url);
    });
  });

  describe('passwordResetEmail', () => {
    const url = 'https://app/reset?token=def';
    const email = passwordResetEmail(url);

    it('has a reset subject', () => {
      expect(email.subject).toMatch(/reset/i);
    });

    it('embeds the reset URL in both text and html bodies', () => {
      expect(email.text).toContain(url);
      expect(email.html).toContain(url);
    });
  });
});
