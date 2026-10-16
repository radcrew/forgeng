import { layout, type RenderedEmail } from '../../../core/mail';

export const applicationAcceptedEmail = (params: {
  applicantName: string;
  dashboardUrl: string;
  /** The cohort the student was placed in, if one was chosen on accept. */
  cohortName?: string | null;
}): RenderedEmail => {
  const { applicantName, dashboardUrl, cohortName } = params;
  // Only claim a cohort when the student was actually placed in one.
  const placement = cohortName
    ? `You have been added to the ${cohortName} cohort.`
    : 'We will add you to a cohort soon and let you know when it is ready.';

  return {
    subject: 'Your Forgeng application has been accepted!',
    text: [
      `Hi ${applicantName},`,
      '',
      'Congratulations, your application has been accepted!',
      placement,
      '',
      'Head to your dashboard to get started:',
      dashboardUrl,
    ].join('\n'),
    html: layout({
      preheader: 'Your application has been accepted — welcome aboard!',
      heading: "You're in! 🎉",
      intro: [
        `Hi ${applicantName},`,
        'Congratulations, your application to the Forgeng apprenticeship program has been accepted!',
        placement,
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
