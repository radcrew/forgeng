import { layout, type RenderedEmail } from '@core/mail';

export const paymentEligibleEmail = (params: {
  studentName: string;
  url: string;
}): RenderedEmail => {
  const { studentName, url } = params;

  return {
    subject: 'You completed all tasks — your stipend is being prepared',
    text: [
      `Hi ${studentName},`,
      '',
      'You completed all your tasks for this month — great work!',
      '',
      'Our team will review your submissions and send your monthly stipend within 2 business days.',
      '',
      'You can track your progress on your dashboard:',
      url,
    ].join('\n'),
    html: layout({
      preheader: 'Your monthly stipend is being prepared.',
      heading: 'Stipend on the way',
      intro: [
        `Hi ${studentName},`,
        'You completed all your tasks for this month — great work!',
        'Our team will review your submissions and send your monthly USDT stipend within <strong>2 business days</strong>.',
      ],
      buttonLabel: 'View dashboard',
      buttonUrl: url,
      footnotes: [],
    }),
  };
};
