import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';
import { waitUntil } from '@vercel/functions';
import { PrismaService } from '@core/database/prisma.service';
import { AuthService } from '@modules/auth/auth.service';
import { EmailService } from '@modules/auth/services/email.service';
import { RegionRestrictionService } from '@modules/auth/services/region-restriction.service';
import { TokenService } from '@modules/auth/services/token.service';
import { VerificationService } from '@modules/auth/services/verification.service';

jest.mock('@vercel/functions', () => ({ waitUntil: jest.fn() }));

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'ada@example.com',
    passwordHash: 'hashed',
    emailVerified: true,
    name: 'Ada Lovelace',
    role: 'student',
    avatarUrl: null,
    registrationIp: null,
    registrationCountry: null,
    registrationCity: null,
    createdAt: DATE,
    ...overrides,
  } as User;
}

const TOKENS = {
  accessToken: 'a',
  accessExpiresIn: 900,
  refreshToken: 'r',
  refreshExpiresAt: DATE,
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let password: { hash: jest.Mock; verify: jest.Mock };
  let tokens: { issueForUser: jest.Mock; revoke: jest.Mock };
  let verification: { issue: jest.Mock };
  let email: {
    sendVerificationEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
  };
  let geo: { lookup: jest.Mock };
  let regionRestriction: { check: jest.Mock };

  beforeEach(() => {
    // So a waitUntil check sees only its own test's calls.
    (waitUntil as jest.Mock).mockClear();
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
    password = {
      hash: jest.fn().mockResolvedValue('hashed'),
      verify: jest.fn(),
    };
    tokens = {
      issueForUser: jest.fn().mockResolvedValue(TOKENS),
      revoke: jest.fn().mockResolvedValue(undefined),
    };
    verification = { issue: jest.fn().mockResolvedValue('raw-token') };
    email = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };
    geo = { lookup: jest.fn().mockReturnValue({ country: 'US', city: 'NYC' }) };
    regionRestriction = { check: jest.fn().mockResolvedValue(null) };
    const config = {
      getOrThrow: jest.fn().mockReturnValue('https://app/verify'),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      password,
      tokens as unknown as TokenService,
      verification as unknown as VerificationService,
      email as unknown as EmailService,
      geo,
      regionRestriction as unknown as RegionRestrictionService,
      config as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('rejects an already-registered email', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      await expect(
        service.register(
          { email: 'ada@example.com', password: 'pw', name: 'Ada' },
          {},
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a user, hashes the password, and sends verification', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(makeUser({ emailVerified: false }));

      const result = await service.register(
        { email: 'Ada@Example.com', password: 'pw', name: 'Ada' },
        { ip: '1.2.3.4' },
      );

      expect(password.hash).toHaveBeenCalledWith('pw');
      // Email is normalized to lowercase before persisting.
      const data = (
        prisma.user.create.mock.calls[0] as [{ data: { email: string } }]
      )[0].data;
      expect(data.email).toBe('ada@example.com');
      expect(email.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(result.user.email).toBe('ada@example.com');
    });

    it('keeps the function alive for the verification email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(makeUser({ emailVerified: false }));

      await service.register({ email: 'ada@example.com', password: 'pw' }, {});

      // On Vercel, waitUntil stops the function from freezing mid-send.
      expect(waitUntil).toHaveBeenCalledWith(expect.any(Promise));
    });

    it('still registers when the verification email fails to send', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(makeUser({ emailVerified: false }));
      email.sendVerificationEmail.mockRejectedValue(new Error('ETIMEDOUT'));

      const result = await service.register(
        { email: 'ada@example.com', password: 'pw' },
        {},
      );

      expect(result.user.email).toBe('ada@example.com');
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@y.z', password: 'pw' }, {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      password.verify.mockResolvedValue(false);
      await expect(
        service.login({ email: 'ada@example.com', password: 'bad' }, {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('forbids login for an unverified email', async () => {
      prisma.user.findUnique.mockResolvedValue(
        makeUser({ emailVerified: false }),
      );
      password.verify.mockResolvedValue(true);
      await expect(
        service.login({ email: 'ada@example.com', password: 'pw' }, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('issues tokens on a valid login', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      password.verify.mockResolvedValue(true);

      const result = await service.login(
        { email: 'ada@example.com', password: 'pw' },
        { ip: '1.2.3.4' },
      );

      expect(result.tokens).toEqual(TOKENS);
      expect(tokens.issueForUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('does nothing when no token is presented', async () => {
      await service.logout(undefined);
      expect(tokens.revoke).not.toHaveBeenCalled();
    });

    it('revokes a presented token', async () => {
      await service.logout('refresh-token');
      expect(tokens.revoke).toHaveBeenCalledWith('refresh-token');
    });
  });

  describe('resendVerification', () => {
    it('does nothing for an unknown email (no enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await service.resendVerification('nobody@example.com');
      expect(email.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('does nothing for an already-verified user', async () => {
      prisma.user.findUnique.mockResolvedValue(
        makeUser({ emailVerified: true }),
      );
      await service.resendVerification('ada@example.com');
      expect(email.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('resends verification for an unverified user', async () => {
      prisma.user.findUnique.mockResolvedValue(
        makeUser({ emailVerified: false }),
      );
      await service.resendVerification('ada@example.com');
      expect(email.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('requestPasswordReset', () => {
    it('does nothing for an unknown email (no enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await service.requestPasswordReset('nobody@example.com');
      expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('sends a reset email for a known user', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      await service.requestPasswordReset('ada@example.com');
      expect(email.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      // On Vercel, waitUntil stops the function from freezing mid-send.
      expect(waitUntil).toHaveBeenCalledWith(expect.any(Promise));
    });

    it('resolves when the reset email fails to send', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      email.sendPasswordResetEmail.mockRejectedValue(new Error('ETIMEDOUT'));

      await expect(
        service.requestPasswordReset('ada@example.com'),
      ).resolves.toBeUndefined();
    });
  });

  describe('signInWithOAuth', () => {
    it('rejects a profile with no email', async () => {
      await expect(
        service.signInWithOAuth(
          { provider: 'google', providerAccountId: 'g1' } as never,
          {},
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    describe('public IP lookup for local sign-ins', () => {
      const profile = {
        provider: 'google',
        providerAccountId: 'g1',
        email: 'ada@example.com',
        name: 'Ada',
        emailVerified: true,
      } as never;
      const fetchMock = jest.fn();
      let tx: {
        authIdentity: { findUnique: jest.Mock; create: jest.Mock };
        user: { findUnique: jest.Mock; create: jest.Mock };
      };

      beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock;
        tx = {
          authIdentity: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(makeUser()),
          },
        };
        (prisma as unknown as { $transaction: jest.Mock }).$transaction =
          jest.fn((fn: (client: typeof tx) => Promise<unknown>) => fn(tx));
      });

      it('skips the lookup for a returning user', async () => {
        prisma.user.findUnique.mockResolvedValue(makeUser());
        tx.authIdentity.findUnique.mockResolvedValue({ user: makeUser() });

        await service.signInWithOAuth(profile, { ip: '127.0.0.1' });

        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('records the public IP for a new user', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        fetchMock.mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('198.51.100.7'),
        });

        await service.signInWithOAuth(profile, { ip: '127.0.0.1' });

        const { data } = (
          tx.user.create.mock.calls[0] as [{ data: { registrationIp: string } }]
        )[0];
        expect(data.registrationIp).toBe('198.51.100.7');
      });
    });
  });
});
