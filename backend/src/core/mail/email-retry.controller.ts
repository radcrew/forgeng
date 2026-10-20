import { timingSafeEqual } from 'node:crypto';

import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';

import type { AppConfiguration } from '../../config';
import { Public } from '../auth/public.decorator';
import { MailService } from './mail.service';

/**
 * Called by Vercel Cron (see `backend/vercel.json`). Vercel sends the
 * CRON_SECRET env var as a bearer token, so this route needs no user login.
 */
@ApiExcludeController()
@Controller('cron')
export class EmailRetryController {
  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  @Public()
  @Get('retry-emails')
  retryEmails(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<{ retried: number; sent: number }> {
    const secret = this.config.get('cronSecret', { infer: true });
    // Without a secret, nobody can call it.
    if (!secret || !matches(authorization, `Bearer ${secret}`)) {
      throw new UnauthorizedException();
    }
    return this.mail.retryFailed();
  }
}

/** Compares in constant time, so the answer time doesn't leak the secret. */
function matches(given: string | undefined, expected: string): boolean {
  const a = Buffer.from(given ?? '');
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
