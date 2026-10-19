import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { waitUntil } from '@vercel/functions';
import { createTransport, type Transporter } from 'nodemailer';

import type { AppConfiguration } from '../../config';
import { PrismaService } from '../database/prisma.service';

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
 * Reuse a few SMTP connections instead of opening one per email. Publishing a
 * task emails every student in the cohort at once, and mail providers refuse
 * too many connections or messages per second. Sends past these limits wait
 * in the pool's queue.
 */
const MAX_CONNECTIONS = 3;
const MAX_MESSAGES_PER_SECOND = 10;

/**
 * Outbox retry rules. A failed email is tried up to MAX_ATTEMPTS times in
 * total, but only while it is recent: an old stipend or task email is no
 * longer useful. The retry runs once a day and the window is 3 days, so an
 * email gets its first send and at most 3 retries. MAX_ATTEMPTS matches that.
 *
 * A row that stays "pending" is never retried. Either its send was cut off
 * (for example, the function hit its time limit), or the email went out and
 * saving "sent" failed. Nothing tells the two apart, and sending a payment or
 * stipend email twice is worse than rarely losing one.
 *
 * Every row is deleted after KEEP_MS, whatever its status: by then it
 * is long past the retry window, and it still holds an email address and
 * the email's text.
 */
const MAX_ATTEMPTS = 4;
const RETRY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const RETRY_BATCH = 200;
const KEEP_MS = 30 * 24 * 60 * 60 * 1000;

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

  constructor(
    private readonly config: ConfigService<AppConfiguration, true>,
    private readonly prisma: PrismaService,
  ) {
    const smtp = this.config.get('smtp', { infer: true });
    this.from = this.config.getOrThrow('emailFrom', { infer: true });

    if (smtp) {
      this.transporter = createTransport({
        pool: true,
        maxConnections: MAX_CONNECTIONS,
        rateDelta: 1000,
        rateLimit: MAX_MESSAGES_PER_SECOND,
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

  /**
   * Sends an email after the response, for an email that follows a save. The
   * save is already done, so the response must not wait for the mail server
   * (up to 20 seconds when it hangs), and a failure is logged, never thrown.
   *
   * The email is kept in the outbox first, so a failed send is tried again by
   * `retryFailed`. On Vercel, waitUntil keeps the function alive until the
   * send finishes. On a long-running server it does nothing, and the send
   * still runs in the background.
   */
  sendInBackground(options: SendMailOptions): void {
    waitUntil(this.recordAndDeliver(options));
  }

  /**
   * Sends the outbox emails that failed again, and deletes old ones. Vercel
   * Cron calls this through the retry route.
   */
  async retryFailed(): Promise<{ retried: number; sent: number }> {
    const now = Date.now();
    const rows = await this.prisma.emailOutbox.findMany({
      where: {
        status: 'failed',
        attempts: { lt: MAX_ATTEMPTS },
        createdAt: { gte: new Date(now - RETRY_WINDOW_MS) },
      },
      orderBy: { id: 'asc' },
      take: RETRY_BATCH,
    });
    // The pool limits how many go out at once.
    const results = await Promise.all(
      rows.map((row) =>
        this.deliver(row.id, {
          to: row.to,
          subject: row.subject,
          text: row.text,
          html: row.html ?? undefined,
        }),
      ),
    );
    await this.prisma.emailOutbox.deleteMany({
      where: { createdAt: { lt: new Date(now - KEEP_MS) } },
    });
    return { retried: rows.length, sent: results.filter(Boolean).length };
  }

  private async recordAndDeliver(options: SendMailOptions): Promise<void> {
    let id: number | null = null;
    try {
      ({ id } = await this.prisma.emailOutbox.create({
        data: {
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        },
        select: { id: true },
      }));
    } catch (err) {
      // Still send it: a missing outbox row only loses the retry.
      this.logger.error(
        `Failed to save "${options.subject}" to the outbox`,
        err instanceof Error ? err.stack : String(err),
      );
    }
    await this.deliver(id, options);
  }

  /** Sends one email and records the result on its outbox row, if any. */
  private async deliver(
    id: number | null,
    options: SendMailOptions,
  ): Promise<boolean> {
    let error: string | null = null;
    try {
      await this.send(options);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to send "${options.subject}" to ${options.to}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
    if (id === null) return error === null;

    // Separate from the send: a failed status update must not mark a sent
    // email as failed. The row then stays "pending", which the retry never
    // sends again.
    try {
      await this.prisma.emailOutbox.update({
        where: { id },
        data:
          error === null
            ? { status: 'sent', sentAt: new Date(), attempts: { increment: 1 } }
            : {
                status: 'failed',
                attempts: { increment: 1 },
                lastError: error.slice(0, 500),
              },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record the result of outbox email ${id}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
    return error === null;
  }

  onModuleDestroy(): void {
    this.transporter?.close();
  }
}
