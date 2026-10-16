import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { JwtStrategy } from '@modules/auth/strategies/jwt.strategy';

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeStrategy(prismaUser: User | null): {
  strategy: JwtStrategy;
  findUnique: jest.Mock;
} {
  const config = {
    getOrThrow: jest.fn().mockReturnValue('access-secret'),
  } as unknown as ConfigService;
  const findUnique = jest.fn().mockResolvedValue(prismaUser);
  const prisma = { user: { findUnique } } as unknown as PrismaService;
  return { strategy: new JwtStrategy(config, prisma), findUnique };
}

describe('JwtStrategy', () => {
  it('returns the user for a valid payload subject', async () => {
    const user = {
      id: 5,
      email: 'ada@example.com',
      role: 'student',
      createdAt: DATE,
    } as User;
    const { strategy, findUnique } = makeStrategy(user);

    const result = await strategy.validate({
      sub: 5,
      role: 'student',
    } as never);

    expect(result).toBe(user);
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it('refuses a token whose role is out of date', async () => {
    // The token still says applicant, but the user is now a student.
    const { strategy } = makeStrategy({
      id: 5,
      role: 'student',
      createdAt: DATE,
    } as User);

    await expect(
      strategy.validate({ sub: 5, role: 'applicant' } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when the user no longer exists', async () => {
    const { strategy } = makeStrategy(null);
    await expect(
      strategy.validate({ sub: 99 } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
