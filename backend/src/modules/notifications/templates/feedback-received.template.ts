import { layout, type RenderedEmail } from '@core/mail';

export const feedbackReceivedEmail = (params: {
  approved: boolean;
  url: string;
}): RenderedEmail => {
  const { approved, url } = params;
  const intro = approved
    ? 'A reviewer approved your submission. Open Forgeng to see their comments.'
    : 'A reviewer left feedback requesting changes on your submission. Open Forgeng to read it and resubmit.';

  return {
    subject: approved
      ? 'Your Forgeng submission was approved'
      : 'New feedback on your Forgeng submission',
    text: [intro, '', url].join('\n'),
    html: layout({
      preheader: approved
        ? 'Your submission was approved.'
        : 'A reviewer left feedback on your submission.',
      heading: approved
        ? 'Your submission was approved 🎉'
        : 'You have new feedback',
      intro: [intro],
      buttonLabel: 'View feedback',
      buttonUrl: url,
      footnotes: [
        'You are receiving this because email notifications are on. Manage them under Notifications → Preferences.',
      ],
    }),
  };
};
