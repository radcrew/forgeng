import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import type { AppConfiguration } from '../../config';
import type { AuthUser } from '../../core/auth/auth.types';
import { CurrentUser } from '../../core/auth/current-user.decorator';
import { Public } from '../../core/auth/public.decorator';
import { Roles } from '../../core/auth/roles.decorator';
import {
  GoogleCalendarAuthService,
  GoogleCalendarConnectError,
  type GoogleCalendarStatus,
} from './google-calendar-auth.service';
import { STATE_TTL_MS } from './oauth-state';

const NONCE_COOKIE = 'forgeng_gcal_nonce';
const COOKIE_PATH = '/api/integrations/google-calendar';

/**
 * An admin connects their Google Calendar here, so Forgeng can add meetings
 * to it. The connect link is opened as a page, not called with fetch,
 * because it sends the browser on to Google.
 */
@ApiTags('integrations')
@Controller('integrations/google-calendar')
export class GoogleCalendarController {
  private readonly frontendUrl: string;
  private readonly secureCookies: boolean;

  constructor(
    private readonly service: GoogleCalendarAuthService,
    config: ConfigService<AppConfiguration, true>,
  ) {
    this.frontendUrl = config.get('frontendUrl', { infer: true });
    this.secureCookies =
      config.get('nodeEnv', { infer: true }) === 'production';
  }

  @Roles('admin')
  @Get()
  status(@CurrentUser() user: AuthUser): Promise<GoogleCalendarStatus> {
    return this.service.status(user.id);
  }

  @Roles('admin')
  @Get('connect')
  connect(@CurrentUser() user: AuthUser, @Res() res: Response): void {
    const { url, nonce } = this.service.startConnect(user.id);
    // Lax, so the browser still sends it when Google sends the admin back.
    res.cookie(NONCE_COOKIE, nonce, {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: 'lax',
      path: COOKIE_PATH,
      maxAge: STATE_TTL_MS,
    });
    res.redirect(url);
  }

  // Public: Google sends the browser here. The signed state and the nonce
  // cookie prove which admin started it.
  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const cookies: unknown = (req as Request & { cookies?: unknown }).cookies;
    const nonceCookie =
      cookies && typeof cookies === 'object'
        ? (cookies as Record<string, unknown>)[NONCE_COOKIE]
        : undefined;
    res.clearCookie(NONCE_COOKIE, { path: COOKIE_PATH });

    let result: string;
    try {
      await this.service.finishConnect({
        code,
        state,
        error,
        nonceCookie: typeof nonceCookie === 'string' ? nonceCookie : undefined,
      });
      result = 'connected';
    } catch (err) {
      if (!(err instanceof GoogleCalendarConnectError)) throw err;
      result = err.reason;
    }
    res.redirect(`${this.frontendUrl}/admin/meetings?googleCalendar=${result}`);
  }

  @Roles('admin')
  @Delete()
  @HttpCode(204)
  disconnect(@CurrentUser() user: AuthUser): Promise<void> {
    return this.service.disconnect(user.id);
  }
}
