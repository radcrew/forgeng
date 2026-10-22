import { createHmac, timingSafeEqual } from 'node:crypto';

import { UnauthorizedException, type RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

/** Slack's events are refused when older than this, so they can't be replayed. */
export const MAX_EVENT_AGE_SECONDS = 5 * 60;

/**
 * Checks that a request really comes from Slack. Slack signs
 * "v0:<timestamp>:<raw body>" with the app's signing secret, and sends the
 * result as "v0=<hex>" in the X-Slack-Signature header.
 */
export function verifySlackSignature(params: {
  rawBody: Buffer | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
  signingSecret: string;
  /** In seconds since 1970. */
  now?: number;
}): boolean {
  const { rawBody, timestamp, signature, signingSecret } = params;
  if (!rawBody || !timestamp || !signature) return false;

  const sentAt = Number(timestamp);
  const now = params.now ?? Math.floor(Date.now() / 1000);
  if (
    !Number.isInteger(sentAt) ||
    Math.abs(now - sentAt) > MAX_EVENT_AGE_SECONDS
  ) {
    return false;
  }

  const expected = Buffer.from(
    `v0=${createHmac('sha256', signingSecret)
      .update(`v0:${timestamp}:`)
      .update(rawBody)
      .digest('hex')}`,
  );
  const given = Buffer.from(signature);
  // Constant time, so the answer time doesn't leak the right signature.
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * Refuses a request to a Slack route that Slack didn't sign. Without a
 * signing secret, every request is refused.
 */
export function assertFromSlack(
  req: RawBodyRequest<Request>,
  signingSecret: string | null,
): void {
  const header = (name: string) => {
    const value = req.headers[name];
    return typeof value === 'string' ? value : undefined;
  };
  if (
    !signingSecret ||
    !verifySlackSignature({
      rawBody: req.rawBody,
      timestamp: header('x-slack-request-timestamp'),
      signature: header('x-slack-signature'),
      signingSecret,
    })
  ) {
    throw new UnauthorizedException();
  }
}
