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
 * Nodemailer defaults are far too generous for a web request (2 min to connect,
 * 10 min socket idle). Hosts that block outbound SMTP — Render blocks 25/465/587
 * — fail by timing out rather than refusing, so an unreachable port ties up a
 * connection for minutes without these.
 */
const CONNECTION_TIMEOUT_MS = 10_000;
const GREETING_TIMEOUT_MS = 10_000;
const SOCKET_TIMEOUT_MS = 20_000;

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
        connectionTimeout: CONNECTION_TIMEOUT_MS,
        greetingTimeout: GREETING_TIMEOUT_MS,
        socketTimeout: SOCKET_TIMEOUT_MS,
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
