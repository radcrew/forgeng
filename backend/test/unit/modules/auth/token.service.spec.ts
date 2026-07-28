import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { hashToken } from '@common/crypto';
import { TokenService } from '@modules/auth/services/token.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'ada@example.com',
    role: 'student',
    createdAt: DATE,
    ...overrides,
  } as User;
}

describe('TokenService', () => {
  let service: TokenService;
  let jwt: { signAsync: jest.Mock };
  let prisma: {
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(() => {
    jwt = { signAsync: jest.fn().mockResolvedValue('access.jwt') };
    prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    // Config returns duration strings parsed by the service ("15m", "7d").
    const config = {
      getOrThrow: jest.fn((key: string) =>
        key === 'auth.accessTtl'
          ? '15m'
          : key === 'auth.refreshTtl'
            ? '7d'
            : 'secret',
      ),
    };

    service = new TokenService(
      jwt as unknown as JwtService,
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
  });

  describe('issueForUser', () => {
    it('signs an access token and stores a refresh token', async () => {
      const result = await service.issueForUser(makeUser(), { ip: '1.2.3.4' });

      expect(result.accessToken).toBe('access.jwt');
      // 15m -> 900 seconds.
      expect(result.accessExpiresIn).toBe(900);
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
      expect(result.refreshToken).toEqual(expect.any(String));
    });
  });

  describe('rotate', () => {
    it('rejects an unknown refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.rotate('tok')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('revokes all tokens and rejects a token reused after the grace window', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
        revokedAt: new Date(Date.now() - 60_000),
        expiresAt: new Date(Date.now() + 60_000),
        user: makeUser({ id: 2 }),
      });

      await expect(service.rotate('tok')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      // Reuse detection revokes every active token for the user.
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 2, revokedAt: null } }),
      );
    });

    it('serves a token replayed inside the grace window instead of revoking', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
        revokedAt: new Date(Date.now() - 1_000),
        expiresAt: new Date(Date.now() + 60_000),
        user: makeUser({ id: 2 }),
      });

      const result = await service.rotate('tok');

      expect(result.refreshToken).toEqual(expect.any(String));
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
      // The original rotation's replacedByHash stays pointing at the winner.
      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: makeUser({ id: 2 }),
      });
      await expect(service.rotate('tok')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rotates a valid token: revokes the old and issues a new pair', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: makeUser({ id: 2 }),
      });

      const result = await service.rotate('tok', { ip: '1.2.3.4' });

      expect(result.user.id).toBe(2);
      expect(result.accessToken).toBe('access.jwt');
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
      // The old token is marked revoked and linked to its replacement.
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });
  });

  describe('revoke', () => {
    it('revokes the matching active token by its hash', async () => {
      await service.revoke('tok');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tokenHash: hashToken('tok'), revokedAt: null },
        }),
      );
    });
  });

  describe('revokeAllForUser', () => {
    it('revokes every active token for the user', async () => {
      await service.revokeAllForUser(5);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 5, revokedAt: null } }),
      );
    });
  });
});
