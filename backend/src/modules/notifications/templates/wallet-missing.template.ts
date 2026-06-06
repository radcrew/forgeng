import { layout, type RenderedEmail } from '@core/mail';

export const walletMissingEmail = (params: {
  studentName: string;
  url: string;
}): RenderedEmail => {
  const { studentName, url } = params;

  return {
    subject: 'Action required: add your wallet address to receive your stipend',
    text: [
      `Hi ${studentName},`,
      '',
      "You've completed your tasks this month — great work! However, we couldn't process your payment because no wallet address is on file.",
      '',
      'Please log in and add your wallet address so we can release your stipend:',
      url,
    ].join('\n'),
    html: layout({
      preheader: 'Add your wallet address to receive your monthly stipend.',
      heading: 'Your payment is on hold',
      intro: [
        `Hi ${studentName},`,
        "You've completed your tasks this month — great work! However, we couldn't process your stipend payment because no wallet address is on file for your account.",
        'Please add at least one wallet address so we can release your payment. It only takes a minute.',
      ],
      buttonLabel: 'Add wallet address',
      buttonUrl: url,
      footnotes: [
        'Once your wallet is added, let your admin know so they can process the payment.',
      ],
    }),
  };
};
