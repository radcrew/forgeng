import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

import type { AppConfiguration } from '@config';
import { passwordResetEmail, verificationEmail } from './email.templates';

interface SendOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService implements OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService<AppConfiguration, true>) {
    const smtp = this.config.get('smtp', { infer: true });
    this.from = this.config.getOrThrow('emailFrom', { infer: true });

    if (smtp) {
      this.transporter = createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth:
          smtp.user && smtp.pass
            ? { user: smtp.user, pass: smtp.pass }
            : undefined,
      });
    } else {
      this.transporter = null;
      this.logger.warn(
        'SMTP not configured — emails will be logged to the console only.',
      );
    }
  }

  async send(options: SendOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[email:dry-run] to=${options.to} subject="${options.subject}"\n${options.text}`,
      );
      return;
    }
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    await this.send({ to, ...verificationEmail(verifyUrl) });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.send({ to, ...passwordResetEmail(resetUrl) });
  }

  onModuleDestroy(): void {
    this.transporter?.close();
  }
}
