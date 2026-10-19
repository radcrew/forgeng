import { Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { decryptSecret, encryptSecret } from '@common/crypto';
import { PrismaService } from '@core/database/prisma.service';
import { CALENDAR_SCOPE } from '@modules/meetings/google-api';
import { GoogleCalendarAuthService } from '@modules/meetings/google-calendar-auth.service';
import { createOAuthState } from '@modules/meetings/oauth-state';

const tokenKey = randomBytes(32);
const SETTINGS = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  callbackUrl: 'https://app.example/api/integrations/google-calendar/callback',
  tokenKey,
};

/** An ID token whose middle part holds the email, as Google sends it. */
const idToken = (email: string) =>
  `x.${Buffer.from(JSON.stringify({ email })).toString('base64url')}.y`;

const googleAnswer = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(body),
  } as Response);

describe('GoogleCalendarAuthService', () => {
  let prisma: {
    user: { findUnique: jest.Mock };
    googleCalendarConnection: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let fetchMock: jest.Mock;
  const realFetch = global.fetch;

  const makeService = (settings: typeof SETTINGS | null = SETTINGS) =>
    new GoogleCalendarAuthService(
      prisma as unknown as PrismaService,
      { get: () => settings } as never,
    );

  /** A state and nonce for admin 7, as made by the connect route. */
  const started = () => createOAuthState(7, tokenKey);

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: 'admin' }) },
      googleCalendarConnection: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  describe('startConnect', () => {
    it('asks Google for calendar events with a refresh token', () => {
      const { url } = makeService().startConnect(7);
      const params = new URL(url).searchParams;

      expect(url.startsWith('https://accounts.google.com/')).toBe(true);
      expect(params.get('client_id')).toBe('client-id');
      expect(params.get('redirect_uri')).toBe(SETTINGS.callbackUrl);
      expect(params.get('scope')).toContain(CALENDAR_SCOPE);
      expect(params.get('access_type')).toBe('offline');
      expect(params.get('prompt')).toBe('consent');
      expect(params.get('state')).toBeTruthy();
    });

    it('answers 404 when the server has no Google Calendar settings', () => {
      expect(() => makeService(null).startConnect(7)).toThrow(
        NotFoundException,
      );
    });
  });

  describe('finishConnect', () => {
    const goodTokens = {
      refresh_token: 'refresh-123',
      id_token: idToken('mentor@gmail.com'),
      scope: `openid email ${CALENDAR_SCOPE}`,
    };

    it('saves the refresh token encrypted, with the Google email', async () => {
      const { state, nonce } = started();
      fetchMock.mockReturnValue(googleAnswer(goodTokens));

      await makeService().finishConnect({
        code: 'code-1',
        state,
        nonceCookie: nonce,
      });

      const [[call]] = prisma.googleCalendarConnection.upsert.mock.calls as [
        [{ create: { googleEmail: string; refreshTokenEncrypted: string } }],
      ];
      expect(call.create.googleEmail).toBe('mentor@gmail.com');
      expect(call.create.refreshTokenEncrypted).not.toContain('refresh-123');
      expect(decryptSecret(call.create.refreshTokenEncrypted, tokenKey)).toBe(
        'refresh-123',
      );
    });

    it('sends the code to Google with the client secret', async () => {
      const { state, nonce } = started();
      fetchMock.mockReturnValue(googleAnswer(goodTokens));

      await makeService().finishConnect({
        code: 'code-1',
        state,
        nonceCookie: nonce,
      });

      const [url, init] = fetchMock.mock.calls[0] as [
        string,
        { body: URLSearchParams },
      ];
      expect(url).toBe('https://oauth2.googleapis.com/token');
      expect(init.body.get('code')).toBe('code-1');
      expect(init.body.get('client_secret')).toBe('client-secret');
      expect(init.body.get('grant_type')).toBe('authorization_code');
    });

    it('stops when the admin cancelled on Google', async () => {
      const { state, nonce } = started();

      await expect(
        makeService().finishConnect({
          error: 'access_denied',
          state,
          nonceCookie: nonce,
        }),
      ).rejects.toMatchObject({ reason: 'denied' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refuses a callback without a state', async () => {
      await expect(
        makeService().finishConnect({ code: 'c', nonceCookie: 'n' }),
      ).rejects.toMatchObject({ reason: 'state' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refuses a callback from another browser (wrong nonce cookie)', async () => {
      const { state } = started();

      await expect(
        makeService().finishConnect({ code: 'c', state, nonceCookie: 'other' }),
      ).rejects.toMatchObject({ reason: 'state' });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prisma.googleCalendarConnection.upsert).not.toHaveBeenCalled();
    });

    it('refuses a user who is no longer an admin', async () => {
      const { state, nonce } = started();
      prisma.user.findUnique.mockResolvedValue({ role: 'student' });

      await expect(
        makeService().finishConnect({ code: 'c', state, nonceCookie: nonce }),
      ).rejects.toMatchObject({ reason: 'not_admin' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refuses when Google refuses the code', async () => {
      const { state, nonce } = started();
      fetchMock.mockReturnValue(googleAnswer({}, false));

      await expect(
        makeService().finishConnect({ code: 'c', state, nonceCookie: nonce }),
      ).rejects.toMatchObject({ reason: 'token' });
    });

    it('refuses when Google sends no refresh token', async () => {
      const { state, nonce } = started();
      fetchMock.mockReturnValue(
        googleAnswer({ ...goodTokens, refresh_token: undefined }),
      );

      await expect(
        makeService().finishConnect({ code: 'c', state, nonceCookie: nonce }),
      ).rejects.toMatchObject({ reason: 'token' });
    });

    it('refuses and gives the token back when the calendar box was unticked', async () => {
      const { state, nonce } = started();
      fetchMock
        .mockReturnValueOnce(
          googleAnswer({ ...goodTokens, scope: 'openid email' }),
        )
        .mockReturnValueOnce(googleAnswer({}));

      await expect(
        makeService().finishConnect({ code: 'c', state, nonceCookie: nonce }),
      ).rejects.toMatchObject({ reason: 'scope' });
      expect(fetchMock).toHaveBeenLastCalledWith(
        'https://oauth2.googleapis.com/revoke',
        expect.anything(),
      );
      expect(prisma.googleCalendarConnection.upsert).not.toHaveBeenCalled();
    });

    it('refuses when the server has no Google Calendar settings', async () => {
      await expect(
        makeService(null).finishConnect({ code: 'c', state: 's' }),
      ).rejects.toMatchObject({ reason: 'not_configured' });
    });
  });

  describe('disconnect', () => {
    it('removes the access at Google, then forgets the token', async () => {
      prisma.googleCalendarConnection.findUnique.mockResolvedValue({
        refreshTokenEncrypted: encryptSecret('refresh-123', tokenKey),
      });
      fetchMock.mockReturnValue(googleAnswer({}));

      await makeService().disconnect(7);

      const [url, init] = fetchMock.mock.calls[0] as [
        string,
        { body: URLSearchParams },
      ];
      expect(url).toBe('https://oauth2.googleapis.com/revoke');
      expect(init.body.get('token')).toBe('refresh-123');
      expect(prisma.googleCalendarConnection.deleteMany).toHaveBeenCalledWith({
        where: { userId: 7 },
      });
    });

    it('still forgets the token when Google can not be reached', async () => {
      prisma.googleCalendarConnection.findUnique.mockResolvedValue({
        refreshTokenEncrypted: encryptSecret('refresh-123', tokenKey),
      });
      fetchMock.mockRejectedValue(new Error('network down'));

      await makeService().disconnect(7);

      expect(prisma.googleCalendarConnection.deleteMany).toHaveBeenCalled();
    });
  });

  describe('status', () => {
    it('reports a broken connection', async () => {
      prisma.googleCalendarConnection.findUnique.mockResolvedValue({
        googleEmail: 'mentor@gmail.com',
        brokenAt: new Date(),
      });

      await expect(makeService().status(7)).resolves.toEqual({
        configured: true,
        connected: true,
        googleEmail: 'mentor@gmail.com',
        broken: true,
      });
    });
  });
});
