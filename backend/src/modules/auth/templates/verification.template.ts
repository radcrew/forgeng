import { layout, type RenderedEmail } from './layout';

export const verificationEmail = (verifyUrl: string): RenderedEmail => ({
  subject: 'Verify your Forgeng email',
  text: [
    'Welcome to Forgeng!',
    '',
    'Confirm your email address to activate your account:',
    verifyUrl,
    '',
    'This link expires soon. If you did not sign up, you can safely ignore this message.',
  ].join('\n'),
  html: layout({
    preheader: 'Confirm your email to activate your Forgeng account.',
    heading: 'Welcome to Forgeng 👋',
    intro: [
      'Thanks for signing up. Confirm your email address to activate your account and get started.',
    ],
    buttonLabel: 'Verify email',
    buttonUrl: verifyUrl,
    footnotes: [
      'This link expires soon.',
      'If you did not create a Forgeng account, you can safely ignore this email.',
    ],
  }),
});
