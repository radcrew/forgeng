import { randomBytes, createHash } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';

import type { AppConfiguration } from '@config';
import { PrismaService } from '@core/database/prisma.service';
import type { IssuedTokens, JwtPayload } from '../types/jwt-payload.types';

interface RefreshContext {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  async issueForUser(
    user: User,
    ctx: RefreshContext = {},
  ): Promise<IssuedTokens> {
    const access = await this.signAccess(user);
    const refresh = await this.createRefreshToken(user.id, ctx);
    return {
      accessToken: access.token,
      accessExpiresIn: access.expiresIn,
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
    };
  }

  async rotate(
    presentedToken: string,
    ctx: RefreshContext = {},
  ): Promise<IssuedTokens & { user: User }> {
    const tokenHash = hashToken(presentedToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Reuse detection: if a previously-rotated token shows up again, revoke
    // every refresh token for that user — someone likely stole an old one.
    if (record.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token already used.');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired.');
    }

    const next = await this.createRefreshToken(record.userId, ctx);
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date(), replacedByHash: hashToken(next.token) },
    });

    const access = await this.signAccess(record.user);
    return {
      user: record.user,
      accessToken: access.token,
      accessExpiresIn: access.expiresIn,
      refreshToken: next.token,
      refreshExpiresAt: next.expiresAt,
    };
  }

  async revoke(presentedToken: string): Promise<void> {
    const tokenHash = hashToken(presentedToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async signAccess(
    user: User,
  ): Promise<{ token: string; expiresIn: number }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const expiresIn = parseDurationSeconds(
      this.config.getOrThrow('auth.accessTtl', { infer: true }),
    );
    const token = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('auth.accessSecret', { infer: true }),
      expiresIn,
    });
    return { token, expiresIn };
  }

  private async createRefreshToken(
    userId: number,
    ctx: RefreshContext,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(48).toString('base64url');
    const ttlSeconds = parseDurationSeconds(
      this.config.getOrThrow('auth.refreshTtl', { infer: true }),
    );
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt,
        userAgent: ctx.userAgent,
        ip: ctx.ip,
      },
    });
    return { token, expiresAt };
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Parse simple duration strings like "15m", "7d", "3600". Returns seconds. */
function parseDurationSeconds(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)?$/i.exec(value);
  if (!match) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number.parseInt(match[1], 10);
  const unit = (match[2] ?? 's').toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return n * (multipliers[unit] ?? 1);
}
