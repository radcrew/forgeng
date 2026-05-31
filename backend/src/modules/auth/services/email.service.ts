import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

import type { AppConfiguration } from '@config';

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
    await this.send({
      to,
      subject: 'Verify your forgeng email',
      text: `Welcome to forgeng. Confirm your email: ${verifyUrl}\n\nThis link expires soon. If you did not sign up, ignore this message.`,
      html: `<p>Welcome to forgeng.</p><p><a href="${verifyUrl}">Confirm your email</a></p><p>This link expires soon. If you did not sign up, ignore this message.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'Reset your forgeng password',
      text: `We received a request to reset your forgeng password. Reset it here: ${resetUrl}\n\nThis link expires soon. If you did not request this, ignore this message and your password will stay the same.`,
      html: `<p>We received a request to reset your forgeng password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires soon. If you did not request this, ignore this message and your password will stay the same.</p>`,
    });
  }

  onModuleDestroy(): void {
    this.transporter?.close();
  }
}
