import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { AuthService } from '@modules/auth/auth.service';
import { EmailService } from '@modules/auth/services/email.service';
import { TokenService } from '@modules/auth/services/token.service';
import { VerificationService } from '@modules/auth/services/verification.service';

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

  beforeEach(() => {
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
  });
});
