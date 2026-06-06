import { layout, type RenderedEmail } from '@core/mail';

export const paymentReleasedEmail = (params: {
  studentName: string;
  url: string;
}): RenderedEmail => {
  const { studentName, url } = params;

  return {
    subject: 'Your Forgeng monthly stipend has been released',
    text: [
      `Hi ${studentName},`,
      '',
      'Great work this month — you completed all your tasks and your monthly stipend has been released.',
      '',
      'You can check your dashboard for details:',
      url,
    ].join('\n'),
    html: layout({
      preheader: 'Your monthly stipend has been released.',
      heading: 'Your stipend is on its way',
      intro: [
        `Hi ${studentName},`,
        'Great work this month — you completed all your assigned tasks and your monthly stipend has been released. It should arrive within 2 business days to your registered wallet.',
        'Keep it up and you will be eligible again next month.',
      ],
      buttonLabel: 'View dashboard',
      buttonUrl: url,
      footnotes: [],
    }),
  };
};
