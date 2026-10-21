import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { decryptSecret } from '../../common/crypto';
import type { AppConfiguration, GoogleCalendarConfig } from '../../config';
import { PrismaService } from '../../core/database/prisma.service';
import { EVENTS_URL, GOOGLE_TIMEOUT_MS, TOKEN_URL } from './google-api';

/** Why a calendar call failed, so the caller can show the right message. */
export type CalendarFailure =
  | 'not_configured'
  | 'not_connected'
  // Google refused the saved token. The admin must connect again.
  | 'broken'
  | 'failed';

export class GoogleCalendarError extends Error {
  constructor(
    readonly reason: CalendarFailure,
    message: string,
  ) {
    super(message);
  }
}

export interface MeetingEventInput {
  title: string;
  note: string | null;
  startsAt: Date;
  endsAt: Date;
}

export interface CreatedEvent {
  eventId: string;
  meetUrl: string | null;
}

interface GoogleEvent {
  id?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
}

/**
 * Adds, moves and cancels meetings in an admin's Google Calendar. Google
 * emails the attendee for each change (`sendUpdates=all`), so the student
 * gets an invite that works with any calendar app.
 */
@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private readonly settings: GoogleCalendarConfig | null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<AppConfiguration, true>,
  ) {
    this.settings = config.get('googleCalendar', { infer: true });
  }

  /** Creates the event with a Google Meet link, and invites the attendee. */
  async createEvent(
    hostId: number,
    input: MeetingEventInput & { attendeeEmail: string },
  ): Promise<CreatedEvent> {
    const params = new URLSearchParams({
      conferenceDataVersion: '1',
      sendUpdates: 'all',
    });
    const res = await this.call(hostId, `${EVENTS_URL}?${params}`, {
      method: 'POST',
      body: JSON.stringify({
        ...eventFields(input),
        attendees: [{ email: input.attendeeEmail }],
        conferenceData: {
          createRequest: {
            // Lets Google ignore a repeated request instead of making a
            // second Meet room.
            requestId: randomUUID(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      }),
    });
    const event = (await res.json()) as GoogleEvent;
    if (!event.id) {
      throw new GoogleCalendarError('failed', 'Google sent no event id.');
    }
    return { eventId: event.id, meetUrl: meetUrlOf(event) };
  }

  /** Moves or renames the event. Google emails the attendee the change. */
  async updateEvent(
    hostId: number,
    eventId: string,
    input: MeetingEventInput,
  ): Promise<void> {
    await this.call(hostId, eventUrl(eventId), {
      method: 'PATCH',
      body: JSON.stringify(eventFields(input)),
    });
  }

  /**
   * Cancels the event. Google emails the attendee. An event that is already
   * gone, for example deleted in Google Calendar, counts as cancelled.
   */
  async deleteEvent(hostId: number, eventId: string): Promise<void> {
    await this.call(
      hostId,
      eventUrl(eventId),
      { method: 'DELETE' },
      [404, 410],
    );
  }

  /** Calls the Calendar API as the admin. `okStatuses` also count as done. */
  private async call(
    hostId: number,
    url: string,
    init: { method: string; body?: string },
    okStatuses: number[] = [],
  ): Promise<Response> {
    const accessToken = await this.accessToken(hostId);
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
      });
    } catch (err) {
      this.logger.error(
        `Failed to reach Google Calendar for user ${hostId}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new GoogleCalendarError(
        'failed',
        'Google Calendar did not answer.',
      );
    }
    if (res.ok || okStatuses.includes(res.status)) return res;
    // The token was just made, so 401 means the access was taken away.
    if (res.status === 401) {
      await this.markBroken(hostId);
      throw new GoogleCalendarError(
        'broken',
        'Google refused the connection. Connect Google Calendar again.',
      );
    }
    this.logger.warn(
      `Google Calendar answered HTTP ${res.status} for user ${hostId}`,
    );
    throw new GoogleCalendarError(
      'failed',
      'Google Calendar refused the change.',
    );
  }

  /** A short-lived access token, made from the stored refresh token. */
  private async accessToken(hostId: number): Promise<string> {
    const settings = this.settings;
    if (!settings) {
      throw new GoogleCalendarError(
        'not_configured',
        'Google Calendar is not set up on this server.',
      );
    }
    const connection = await this.prisma.googleCalendarConnection.findUnique({
      where: { userId: hostId },
      select: { refreshTokenEncrypted: true, brokenAt: true },
    });
    if (!connection) {
      throw new GoogleCalendarError(
        'not_connected',
        'Connect your Google Calendar first.',
      );
    }
    if (connection.brokenAt) {
      throw new GoogleCalendarError(
        'broken',
        'Google refused the connection. Connect Google Calendar again.',
      );
    }

    // Outside the fetch below, so a token that can't be read isn't reported
    // as Google not answering. For example, GOOGLE_TOKEN_KEY was changed.
    // Only a new connection can fix it, so the admin is asked to connect
    // again.
    let refreshToken: string;
    try {
      refreshToken = decryptSecret(
        connection.refreshTokenEncrypted,
        settings.tokenKey,
      );
    } catch (err) {
      this.logger.error(
        `Failed to read the saved Google Calendar token of user ${hostId}`,
        err instanceof Error ? err.stack : String(err),
      );
      await this.markBroken(hostId);
      throw new GoogleCalendarError(
        'broken',
        'Forgeng could not read your Google Calendar connection. Connect Google Calendar again.',
      );
    }

    let res: Response;
    try {
      res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: settings.clientId,
          client_secret: settings.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
        signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
      });
    } catch (err) {
      this.logger.error(
        `Failed to reach Google for a token for user ${hostId}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new GoogleCalendarError('failed', 'Google did not answer.');
    }

    const body = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      error?: string;
    };
    // "invalid_grant": the admin removed the access, or the token expired.
    if (body.error === 'invalid_grant') {
      await this.markBroken(hostId);
      throw new GoogleCalendarError(
        'broken',
        'Google refused the connection. Connect Google Calendar again.',
      );
    }
    if (!res.ok || !body.access_token) {
      this.logger.warn(
        `Google refused a token for user ${hostId}: HTTP ${res.status}`,
      );
      throw new GoogleCalendarError('failed', 'Google refused the request.');
    }
    return body.access_token;
  }

  private async markBroken(hostId: number): Promise<void> {
    await this.prisma.googleCalendarConnection.updateMany({
      where: { userId: hostId },
      data: { brokenAt: new Date() },
    });
  }
}

const eventUrl = (eventId: string) =>
  `${EVENTS_URL}/${encodeURIComponent(eventId)}?sendUpdates=all`;

/** The fields Forgeng sets on the event. Times are sent as UTC. */
const eventFields = (input: MeetingEventInput) => ({
  summary: input.title,
  // An empty text clears a note that was removed.
  description: input.note ?? '',
  start: { dateTime: input.startsAt.toISOString() },
  end: { dateTime: input.endsAt.toISOString() },
});

const meetUrlOf = (event: GoogleEvent): string | null =>
  event.hangoutLink ??
  event.conferenceData?.entryPoints?.find((p) => p.entryPointType === 'video')
    ?.uri ??
  null;
