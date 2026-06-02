import { layout, type RenderedEmail } from '@core/mail';

export const taskPublishedEmail = (params: {
  taskTitle: string;
  url: string;
}): RenderedEmail => {
  const { taskTitle, url } = params;
  const intro = `A new task is available in your cohort: "${taskTitle}". Open Forgeng to get started.`;

  return {
    subject: `New task: ${taskTitle}`,
    text: [intro, '', url].join('\n'),
    html: layout({
      preheader: `New task published: ${taskTitle}`,
      heading: 'New task published',
      intro: [intro],
      buttonLabel: 'View task',
      buttonUrl: url,
      footnotes: [
        'You are receiving this because email notifications are on. Manage them under Notifications → Preferences.',
      ],
    }),
  };
};
