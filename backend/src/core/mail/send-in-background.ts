import type { Logger } from '@nestjs/common';
import { waitUntil } from '@vercel/functions';

import type { MailService, SendMailOptions } from './mail.service';

/**
 * Sends an email after the response, for an email that follows a save. The
 * save is already done, so the response must not wait for the mail server
 * (up to 20 seconds when it hangs), and a failure is logged, never thrown.
 *
 * On Vercel, waitUntil keeps the function alive until the send finishes. On a
 * long-running server it does nothing, and the send still runs in the
 * background.
 */
export function sendInBackground(
  mail: MailService,
  options: SendMailOptions,
  logger: Logger,
): void {
  waitUntil(
    mail.send(options).catch((err: unknown) => {
      logger.error(
        `Failed to send "${options.subject}" to ${options.to}`,
        err instanceof Error ? err.stack : String(err),
      );
    }),
  );
}
