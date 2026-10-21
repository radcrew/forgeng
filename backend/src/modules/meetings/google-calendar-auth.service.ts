import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { decryptSecret, encryptSecret } from '../../common/crypto';
import type { AppConfiguration, GoogleCalendarConfig } from '../../config';
import { PrismaService } from '../../core/database/prisma.service';
import {
  AUTH_URL,
  CALENDAR_SCOPE,
  GOOGLE_TIMEOUT_MS,
  REVOKE_URL,
  TOKEN_URL,
} from './google-api';
import { createOAuthState, verifyOAuthState } from './oauth-state';

export interface GoogleCalendarStatus {
  /** False when the server has no Google Calendar settings. */
  configured: boolean;
  connected: boolean;
  googleEmail: string | null;
  /** Google refused the saved token. The admin must connect again. */
  broken: boolean;
}

/** Why a connection failed. It is shown in the meetings page's link. */
export type ConnectFailure =
  | 'not_configured'
  | 'denied'
  | 'state'
  | 'not_admin'
  | 'scope'
  | 'token'
  // Another Google account than the saved one, while upcoming meetings are
  // still in the saved account's calendar.
  | 'other_account';

export class GoogleCalendarConnectError extends Error {
  constructor(readonly reason: ConnectFailure) {
    super(`Google Calendar connection failed: ${reason}`);
  }
}

interface TokenResponse {
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

@Injectable()
export class GoogleCalendarAuthService {
  private readonly logger = new Logger(GoogleCalendarAuthService.name);
  private readonly settings: GoogleCalendarConfig | null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<AppConfiguration, true>,
  ) {
    this.settings = config.get('googleCalendar', { infer: true });
  }

  async status(userId: number): Promise<GoogleCalendarStatus> {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId },
      select: { googleEmail: true, brokenAt: true },
    });
    return {
      configured: this.settings !== null,
      connected: connection !== null,
      googleEmail: connection?.googleEmail ?? null,
      broken: connection?.brokenAt != null,
    };
  }

  /**
   * The Google consent page to send the admin to, and the nonce to keep in
   * their browser until Google sends them back.
   */
  startConnect(userId: number): { url: string; nonce: string } {
    const settings = this.requireSettings();
    const { state, nonce } = createOAuthState(userId, settings.tokenKey);
    const params = new URLSearchParams({
      client_id: settings.clientId,
      redirect_uri: settings.callbackUrl,
      response_type: 'code',
      scope: `openid email ${CALENDAR_SCOPE}`,
      // A refresh token, so Forgeng can add meetings later without the admin.
      access_type: 'offline',
      // Google only sends a refresh token on consent. Asking every time means
      // a second connect also gets one.
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    });
    return { url: `${AUTH_URL}?${params.toString()}`, nonce };
  }

  /**
   * Finishes the connection when Google sends the admin back. Throws a
   * GoogleCalendarConnectError that says what went wrong.
   */
  async finishConnect(params: {
    code?: string;
    state?: string;
    error?: string;
    nonceCookie?: string;
  }): Promise<void> {
    const settings = this.settings;
    if (!settings) throw new GoogleCalendarConnectError('not_configured');
    // For example, the admin pressed "Cancel" on Google's page.
    if (params.error || !params.code) {
      throw new GoogleCalendarConnectError('denied');
    }

    const userId = params.state
      ? verifyOAuthState(params.state, params.nonceCookie, settings.tokenKey)
      : null;
    if (userId === null) throw new GoogleCalendarConnectError('state');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== 'admin') {
      throw new GoogleCalendarConnectError('not_admin');
    }

    const tokens = await this.exchangeCode(params.code, settings);
    if (!tokens?.refresh_token) throw new GoogleCalendarConnectError('token');

    // Google's consent page lets the admin untick the calendar box.
    const granted = (tokens.scope ?? '').split(' ');
    if (!granted.includes(CALENDAR_SCOPE)) {
      await this.revokeUnused(userId, tokens.refresh_token);
      throw new GoogleCalendarConnectError('scope');
    }

    const googleEmail = emailFromIdToken(tokens.id_token);
    if (!googleEmail) throw new GoogleCalendarConnectError('token');

    // Upcoming meetings are events in the saved account's calendar. With
    // another account's token, Forgeng could no longer move or cancel them.
    if (await this.switchesAccountWithMeetings(userId, googleEmail)) {
      await this.revokeUnused(userId, tokens.refresh_token);
      throw new GoogleCalendarConnectError('other_account');
    }

    const refreshTokenEncrypted = encryptSecret(
      tokens.refresh_token,
      settings.tokenKey,
    );
    await this.prisma.googleCalendarConnection.upsert({
      where: { userId },
      create: { userId, googleEmail, refreshTokenEncrypted },
      update: {
        googleEmail,
        refreshTokenEncrypted,
        connectedAt: new Date(),
        brokenAt: null,
      },
    });
  }

  /** Removes Forgeng's access at Google, then forgets the token. */
  async disconnect(userId: number): Promise<void> {
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId },
      select: { refreshTokenEncrypted: true },
    });
    if (!connection) return;
    if (this.settings) {
      try {
        await this.revoke(
          decryptSecret(
            connection.refreshTokenEncrypted,
            this.settings.tokenKey,
          ),
        );
      } catch (err) {
        // Forget the token anyway. The admin can also remove the access in
        // their Google account.
        this.logger.error(
          `Failed to revoke the Google Calendar token of user ${userId}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
    await this.prisma.googleCalendarConnection.deleteMany({
      where: { userId },
    });
  }

  /**
   * True when the admin connects another Google account than the saved one
   * while they still host upcoming meetings in the saved account's calendar.
   */
  private async switchesAccountWithMeetings(
    userId: number,
    googleEmail: string,
  ): Promise<boolean> {
    const saved = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId },
      select: { googleEmail: true },
    });
    if (
      !saved ||
      saved.googleEmail.toLowerCase() === googleEmail.toLowerCase()
    ) {
      return false;
    }
    const upcoming = await this.prisma.meeting.count({
      where: {
        hostId: userId,
        status: 'scheduled',
        googleEventId: { not: null },
        endsAt: { gte: new Date() },
      },
    });
    return upcoming > 0;
  }

  private requireSettings(): GoogleCalendarConfig {
    if (!this.settings) {
      throw new NotFoundException(
        'Google Calendar is not set up on this server.',
      );
    }
    return this.settings;
  }

  private async exchangeCode(
    code: string,
    settings: GoogleCalendarConfig,
  ): Promise<TokenResponse | null> {
    try {
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: settings.clientId,
          client_secret: settings.clientSecret,
          redirect_uri: settings.callbackUrl,
          grant_type: 'authorization_code',
        }),
        signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn(`Google refused the code: HTTP ${res.status}`);
        return null;
      }
      return (await res.json()) as TokenResponse;
    } catch (err) {
      this.logger.error(
        'Failed to reach Google to finish the connection',
        err instanceof Error ? err.stack : String(err),
      );
      return null;
    }
  }

  /**
   * Gives back a token Forgeng won't keep. Never throws, so the admin still
   * gets the real reason the connection was refused.
   */
  private async revokeUnused(userId: number, token: string): Promise<void> {
    try {
      await this.revoke(token);
    } catch (err) {
      this.logger.error(
        `Failed to revoke an unused Google Calendar token of user ${userId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async revoke(token: string): Promise<void> {
    const res = await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
      signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Google answered HTTP ${res.status}`);
  }
}

/**
 * The email in Google's ID token. The token comes straight from Google over
 * HTTPS, in answer to our own request, so its signature isn't checked again.
 */
function emailFromIdToken(idToken: string | undefined): string | null {
  const payload = idToken?.split('.')[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { email?: unknown };
    return typeof claims.email === 'string' ? claims.email : null;
  } catch {
    return null;
  }
}
