import { Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { encryptSecret } from '@common/crypto';
import { PrismaService } from '@core/database/prisma.service';
import { GoogleCalendarService } from '@modules/meetings/google-calendar.service';

const tokenKey = randomBytes(32);
const SETTINGS = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  callbackUrl: 'https://app.example/callback',
  tokenKey,
};
const EVENTS =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

const answer = (status: number, body: unknown = {}) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

const MEETING = {
  title: 'Mentoring call',
  note: 'Bring your CLI project',
  startsAt: new Date('2026-11-02T15:00:00.000Z'),
  endsAt: new Date('2026-11-02T15:30:00.000Z'),
};

describe('GoogleCalendarService', () => {
  let prisma: {
    googleCalendarConnection: { findUnique: jest.Mock; updateMany: jest.Mock };
  };
  let fetchMock: jest.Mock;
  const realFetch = global.fetch;

  const makeService = (settings: typeof SETTINGS | null = SETTINGS) =>
    new GoogleCalendarService(
      prisma as unknown as PrismaService,
      { get: () => settings } as never,
    );

  /** Google's token answer, then the Calendar API's answer. */
  const googleAnswers = (calendar: Promise<Response>) =>
    fetchMock
      .mockReturnValueOnce(answer(200, { access_token: 'access-1' }))
      .mockReturnValueOnce(calendar);

  const calendarCall = () =>
    fetchMock.mock.calls[1] as [
      string,
      { method: string; body?: string; headers: Record<string, string> },
    ];

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    prisma = {
      googleCalendarConnection: {
        findUnique: jest.fn().mockResolvedValue({
          refreshTokenEncrypted: encryptSecret('refresh-123', tokenKey),
          brokenAt: null,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  describe('createEvent', () => {
    it('creates the event with a Meet link and invites the attendee', async () => {
      googleAnswers(
        answer(200, {
          id: 'evt-1',
          hangoutLink: 'https://meet.google.com/abc',
        }),
      );

      const created = await makeService().createEvent(7, {
        ...MEETING,
        attendeeEmail: 'ada@example.com',
      });

      expect(created).toEqual({
        eventId: 'evt-1',
        meetUrl: 'https://meet.google.com/abc',
      });
      const [url, init] = calendarCall();
      const params = new URL(url).searchParams;
      expect(url.startsWith(EVENTS)).toBe(true);
      expect(params.get('sendUpdates')).toBe('all');
      expect(params.get('conferenceDataVersion')).toBe('1');
      expect(init.method).toBe('POST');
      expect(init.headers.Authorization).toBe('Bearer access-1');
      const body = JSON.parse(init.body ?? '{}') as Record<string, unknown>;
      expect(body).toMatchObject({
        summary: 'Mentoring call',
        description: 'Bring your CLI project',
        start: { dateTime: '2026-11-02T15:00:00.000Z' },
        end: { dateTime: '2026-11-02T15:30:00.000Z' },
        attendees: [{ email: 'ada@example.com' }],
        conferenceData: {
          createRequest: { conferenceSolutionKey: { type: 'hangoutsMeet' } },
        },
      });
    });

    it('makes the access token from the stored refresh token', async () => {
      googleAnswers(answer(200, { id: 'evt-1' }));

      await makeService().createEvent(7, {
        ...MEETING,
        attendeeEmail: 'ada@example.com',
      });

      const [url, init] = fetchMock.mock.calls[0] as [
        string,
        { body: URLSearchParams },
      ];
      expect(url).toBe('https://oauth2.googleapis.com/token');
      expect(init.body.get('grant_type')).toBe('refresh_token');
      expect(init.body.get('refresh_token')).toBe('refresh-123');
    });

    it('reads the Meet link from the conference data too', async () => {
      googleAnswers(
        answer(200, {
          id: 'evt-1',
          conferenceData: {
            entryPoints: [
              { entryPointType: 'phone', uri: 'tel:+1' },
              { entryPointType: 'video', uri: 'https://meet.google.com/xyz' },
            ],
          },
        }),
      );

      const created = await makeService().createEvent(7, {
        ...MEETING,
        attendeeEmail: 'ada@example.com',
      });

      expect(created.meetUrl).toBe('https://meet.google.com/xyz');
    });
  });

  describe('updateEvent', () => {
    it('changes the same event and tells the attendee', async () => {
      googleAnswers(answer(200, { id: 'evt-1' }));

      await makeService().updateEvent(7, 'evt-1', { ...MEETING, note: null });

      const [url, init] = calendarCall();
      expect(url).toBe(`${EVENTS}/evt-1?sendUpdates=all`);
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body ?? '{}')).toMatchObject({ description: '' });
    });
  });

  describe('deleteEvent', () => {
    it('cancels the event and tells the attendee', async () => {
      googleAnswers(answer(204));

      await makeService().deleteEvent(7, 'evt-1');

      const [url, init] = calendarCall();
      expect(url).toBe(`${EVENTS}/evt-1?sendUpdates=all`);
      expect(init.method).toBe('DELETE');
    });

    it.each([404, 410])(
      'counts an event that is already gone (%i) as cancelled',
      async (status) => {
        googleAnswers(answer(status));

        await expect(
          makeService().deleteEvent(7, 'evt-1'),
        ).resolves.toBeUndefined();
      },
    );
  });

  describe('failures', () => {
    const create = (service = makeService()) =>
      service.createEvent(7, { ...MEETING, attendeeEmail: 'ada@example.com' });

    it('says when the server has no Google Calendar settings', async () => {
      await expect(create(makeService(null))).rejects.toMatchObject({
        reason: 'not_configured',
      });
    });

    it('says when the admin has not connected Google', async () => {
      prisma.googleCalendarConnection.findUnique.mockResolvedValue(null);

      await expect(create()).rejects.toMatchObject({ reason: 'not_connected' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not call Google for a connection already marked broken', async () => {
      prisma.googleCalendarConnection.findUnique.mockResolvedValue({
        refreshTokenEncrypted: encryptSecret('refresh-123', tokenKey),
        brokenAt: new Date(),
      });

      await expect(create()).rejects.toMatchObject({ reason: 'broken' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('marks the connection broken when Google refuses the refresh token', async () => {
      fetchMock.mockReturnValueOnce(answer(400, { error: 'invalid_grant' }));

      await expect(create()).rejects.toMatchObject({ reason: 'broken' });
      expect(prisma.googleCalendarConnection.updateMany).toHaveBeenCalledWith({
        where: { userId: 7 },
        data: { brokenAt: expect.any(Date) as unknown },
      });
    });

    it('marks the connection broken when the Calendar API answers 401', async () => {
      googleAnswers(answer(401));

      await expect(create()).rejects.toMatchObject({ reason: 'broken' });
      expect(prisma.googleCalendarConnection.updateMany).toHaveBeenCalled();
    });

    it('reports other Google errors without breaking the connection', async () => {
      googleAnswers(answer(500));

      await expect(create()).rejects.toMatchObject({ reason: 'failed' });
      expect(prisma.googleCalendarConnection.updateMany).not.toHaveBeenCalled();
    });

    it('reports a Google that does not answer', async () => {
      fetchMock.mockRejectedValue(new Error('timeout'));

      await expect(create()).rejects.toMatchObject({ reason: 'failed' });
    });
  });
});
