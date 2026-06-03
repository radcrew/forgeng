import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

import type { AppConfiguration } from '@config';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Generic transactional email sender. Wraps a single nodemailer transport so
 * every feature shares one connection pool and a consistent `from` address.
 * When SMTP is unconfigured (dev), emails are logged instead of sent.
 */
@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
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

  async send(options: SendMailOptions): Promise<void> {
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

  onModuleDestroy(): void {
    this.transporter?.close();
  }
}
