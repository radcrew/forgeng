import { layout, type RenderedEmail } from '@core/mail';

export const passwordResetEmail = (resetUrl: string): RenderedEmail => ({
  subject: 'Reset your Forgeng password',
  text: [
    'We received a request to reset your Forgeng password.',
    '',
    'Choose a new password here:',
    resetUrl,
    '',
    'This link expires soon. If you did not request this, ignore this message and your password will stay the same.',
  ].join('\n'),
  html: layout({
    preheader: 'Reset your Forgeng password.',
    heading: 'Reset your password',
    intro: [
      'We received a request to reset the password for your Forgeng account. Click the button below to choose a new one.',
    ],
    buttonLabel: 'Reset password',
    buttonUrl: resetUrl,
    footnotes: [
      'This link expires soon.',
      'If you did not request a password reset, you can safely ignore this email — your password will stay the same.',
    ],
  }),
});
