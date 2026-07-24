import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { AuthController } from '@modules/auth/auth.controller';
import { AuthService } from '@modules/auth/auth.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'ada@example.com',
    name: 'Ada',
    role: 'student',
    avatarUrl: null,
    createdAt: DATE,
    ...overrides,
  } as User;
}

const AUTH_RESULT = {
  user: { id: 1, email: 'ada@example.com' },
  tokens: {
    accessToken: 'access',
    accessExpiresIn: 900,
    refreshToken: 'refresh',
    refreshExpiresAt: DATE,
  },
};

function makeRes() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  } as unknown as Response & {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
    redirect: jest.Mock;
  };
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ip: '9.9.9.9',
    ...overrides,
  } as Request;
}

describe('AuthController', () => {
  let controller: AuthController;
  let service: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
    verifyEmail: jest.Mock;
    resendVerification: jest.Mock;
    requestPasswordReset: jest.Mock;
    resetPassword: jest.Mock;
    signInWithOAuth: jest.Mock;
  };

  beforeEach(() => {
    service = {
      register: jest.fn().mockResolvedValue({ user: { id: 1 } }),
      login: jest.fn().mockResolvedValue(AUTH_RESULT),
      refresh: jest.fn().mockResolvedValue(AUTH_RESULT),
      logout: jest.fn().mockResolvedValue(undefined),
      verifyEmail: jest.fn().mockResolvedValue({ id: 1 }),
      resendVerification: jest.fn().mockResolvedValue(undefined),
      requestPasswordReset: jest.fn().mockResolvedValue(undefined),
      resetPassword: jest.fn().mockResolvedValue(undefined),
      signInWithOAuth: jest.fn().mockResolvedValue(AUTH_RESULT),
    };
    const config = {
      getOrThrow: jest.fn((key: string) => {
        switch (key) {
          case 'auth.refreshCookieName':
            return 'rt';
          case 'auth.accessCookieName':
            return 'at';
          case 'nodeEnv':
            return 'test';
          case 'auth.oauthSuccessRedirect':
            return 'https://app/oauth';
          case 'auth.oauthFailureRedirect':
            return 'https://app/login?error=oauth';
          default:
            return '';
        }
      }),
      get: jest.fn().mockReturnValue(undefined),
    };
    controller = new AuthController(
      service as unknown as AuthService,
      config as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('delegates with the dto and a request context (ip, ua)', async () => {
      const req = makeReq({
        ip: '1.2.3.4',
        headers: { 'user-agent': 'jest' },
      } as Partial<Request>);

      await controller.register({ email: 'a@b.c' } as never, req);

      expect(service.register).toHaveBeenCalledWith(
        { email: 'a@b.c' },
        { userAgent: 'jest', ip: '1.2.3.4' },
      );
    });
  });

  describe('login', () => {
    it('sets httpOnly cookies and returns only the user', async () => {
      const res = makeRes();
      const result = await controller.login(
        { email: 'a@b.c', password: 'pw' },
        makeReq(),
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        'rt',
        'refresh',
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
      expect(result).toEqual({ user: AUTH_RESULT.user });
    });
  });

  describe('refresh', () => {
    it('throws when the refresh cookie is missing', async () => {
      const req = makeReq({ cookies: {} } as Partial<Request>);
      await expect(controller.refresh(req, makeRes())).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(service.refresh).not.toHaveBeenCalled();
    });

    it('rotates the session when the cookie is present', async () => {
      const req = makeReq({ cookies: { rt: 'old' } } as Partial<Request>);
      const res = makeRes();

      await controller.refresh(req, res);

      expect(service.refresh).toHaveBeenCalledWith('old', expect.any(Object));
      expect(res.cookie).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes the token and clears the cookie', async () => {
      const req = makeReq({ cookies: { rt: 'tok' } } as Partial<Request>);
      const res = makeRes();

      await controller.logout(req, res);

      expect(service.logout).toHaveBeenCalledWith('tok');
      // Clear must carry the same attributes as set, or the browser won't
      // delete the cookie. Test env is non-prod, so sameSite=lax / secure=false.
      expect(res.clearCookie).toHaveBeenCalledWith('rt', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        domain: undefined,
        path: '/',
      });
    });
  });

  describe('simple delegations', () => {
    it('verifyEmail returns the user', async () => {
      const result = await controller.verifyEmail({ token: 't' });
      expect(service.verifyEmail).toHaveBeenCalledWith('t');
      expect(result).toEqual({ user: { id: 1 } });
    });

    it('resendVerification delegates the email', async () => {
      await controller.resendVerification({ email: 'a@b.c' });
      expect(service.resendVerification).toHaveBeenCalledWith('a@b.c');
    });

    it('forgotPassword delegates the email', async () => {
      await controller.forgotPassword({ email: 'a@b.c' });
      expect(service.requestPasswordReset).toHaveBeenCalledWith('a@b.c');
    });

    it('resetPassword delegates the token and password', async () => {
      await controller.resetPassword({ token: 't', password: 'pw' });
      expect(service.resetPassword).toHaveBeenCalledWith('t', 'pw');
    });

    it('me maps the current user', () => {
      const dto = controller.me(makeUser());
      expect(dto.id).toBe(1);
    });
  });

  describe('OAuth callback', () => {
    it('redirects to the success URL and sets cookies on success', async () => {
      const req = makeReq({ user: { provider: 'google' } } as never);
      const res = makeRes();

      await controller.googleCallback(req as never, res);

      expect(res.cookie).toHaveBeenCalled();
      const [target] = res.redirect.mock.calls[0] as [string];
      expect(target).toBe('https://app/oauth');
    });

    it('redirects to the failure URL when sign-in throws', async () => {
      service.signInWithOAuth.mockRejectedValue(new Error('denied'));
      const req = makeReq({ user: { provider: 'google' } } as never);
      const res = makeRes();

      await controller.googleCallback(req as never, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://app/login?error=oauth',
      );
    });
  });
});
