import { Injectable } from '@nestjs/common';

import { MailService } from '@core/mail';
import { passwordResetEmail, verificationEmail } from '../templates';

/** Auth-specific email helpers built on the shared {@link MailService}. */
@Injectable()
export class EmailService {
  constructor(private readonly mail: MailService) {}

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    await this.mail.send({ to, ...verificationEmail(verifyUrl) });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.mail.send({ to, ...passwordResetEmail(resetUrl) });
  }
}
