import {
  applicationAcceptedEmail,
  applicationRejectedEmail,
  feedbackReceivedEmail,
  paymentEligibleEmail,
  paymentReleasedEmail,
  taskPublishedEmail,
  walletMissingEmail,
} from '@modules/notifications/templates';

describe('notification email templates', () => {
  describe('applicationAcceptedEmail', () => {
    const email = applicationAcceptedEmail({
      applicantName: 'Ada',
      dashboardUrl: 'https://app/dashboard',
    });

    it('has an accepted subject', () => {
      expect(email.subject).toMatch(/accepted/i);
    });

    it('greets the applicant and links the dashboard', () => {
      expect(email.text).toContain('Ada');
      expect(email.text).toContain('https://app/dashboard');
      expect(email.html).toContain('https://app/dashboard');
    });
  });

  describe('applicationRejectedEmail', () => {
    const email = applicationRejectedEmail({ applicantName: 'Ada' });

    it('has a neutral update subject', () => {
      expect(email.subject).toMatch(/update/i);
    });

    it('greets the applicant', () => {
      expect(email.text).toContain('Ada');
    });
  });

  describe('feedbackReceivedEmail', () => {
    it('uses an approved subject when approved', () => {
      const email = feedbackReceivedEmail({
        approved: true,
        url: 'https://app/s/1',
      });
      expect(email.subject).toMatch(/approved/i);
      expect(email.text).toContain('https://app/s/1');
    });

    it('uses a feedback subject when not approved', () => {
      const email = feedbackReceivedEmail({
        approved: false,
        url: 'https://app/s/1',
      });
      expect(email.subject).toMatch(/feedback/i);
      expect(email.text).toContain('https://app/s/1');
    });
  });

  describe('paymentEligibleEmail', () => {
    const email = paymentEligibleEmail({
      studentName: 'Ada',
      url: 'https://app/pay',
    });

    it('mentions the stipend and links the URL', () => {
      expect(email.subject).toMatch(/stipend/i);
      expect(email.html).toContain('https://app/pay');
    });
  });

  describe('paymentReleasedEmail', () => {
    const email = paymentReleasedEmail({
      studentName: 'Ada',
      url: 'https://app/pay',
    });

    it('announces the released stipend', () => {
      expect(email.subject).toMatch(/released/i);
      expect(email.html).toContain('https://app/pay');
    });
  });

  describe('taskPublishedEmail', () => {
    const email = taskPublishedEmail({
      taskTitle: 'Build a CLI',
      url: 'https://app/task/5',
    });

    it('includes the task title in the subject', () => {
      expect(email.subject).toContain('Build a CLI');
      expect(email.html).toContain('https://app/task/5');
    });
  });

  describe('walletMissingEmail', () => {
    const email = walletMissingEmail({
      studentName: 'Ada',
      url: 'https://app/profile',
    });

    it('asks for a wallet address and links the profile', () => {
      expect(email.subject).toMatch(/wallet/i);
      expect(email.html).toContain('https://app/profile');
    });
  });
});
