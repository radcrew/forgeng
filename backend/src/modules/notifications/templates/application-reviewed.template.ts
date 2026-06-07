import { layout, type RenderedEmail } from '@core/mail';

export const applicationAcceptedEmail = (params: {
  applicantName: string;
  dashboardUrl: string;
}): RenderedEmail => {
  const { applicantName, dashboardUrl } = params;

  return {
    subject: 'Your Forgeng application has been accepted!',
    text: [
      `Hi ${applicantName},`,
      '',
      'Congratulations — your application has been accepted! You are now enrolled as a student.',
      '',
      'Head to your dashboard to get started:',
      dashboardUrl,
    ].join('\n'),
    html: layout({
      preheader: 'Your application has been accepted — welcome aboard!',
      heading: "You're in! 🎉",
      intro: [
        `Hi ${applicantName},`,
        'Congratulations — your application has been accepted! You are now enrolled as a student on the Forgeng apprenticeship program.',
        'Head to your dashboard to see your cohort and tasks.',
      ],
      buttonLabel: 'Go to dashboard',
      buttonUrl: dashboardUrl,
      footnotes: [],
    }),
  };
};

export const applicationRejectedEmail = (params: {
  applicantName: string;
}): RenderedEmail => {
  const { applicantName } = params;

  return {
    subject: 'Update on your Forgeng application',
    text: [
      `Hi ${applicantName},`,
      '',
      'Thank you for applying to Forgeng. After reviewing your application, we are unable to move forward at this time.',
      '',
      'We encourage you to keep building your skills and apply again in a future cohort.',
    ].join('\n'),
    html: layout({
      preheader: 'An update on your Forgeng application.',
      heading: 'Application update',
      intro: [
        `Hi ${applicantName},`,
        'Thank you for applying to Forgeng. After carefully reviewing your application, we are unable to move forward at this time.',
        'We encourage you to keep building your skills and apply again in a future cohort.',
      ],
      footnotes: [],
    }),
  };
};
