import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

import type { AppConfiguration } from '@config';
import { PrismaService } from '@core/database/prisma.service';
import type { AuthUser } from '@core/auth/auth.types';
import type { JwtPayload } from '../types/jwt-payload.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<AppConfiguration, true>,
    private readonly prisma: PrismaService,
  ) {
    const accessCookieName = config.getOrThrow('auth.accessCookieName', {
      infer: true,
    });
    const cookieExtractor = (req: Request): string | null => {
      const cookies: unknown = (req as Request & { cookies?: unknown }).cookies;
      if (!cookies || typeof cookies !== 'object') return null;
      const value = (cookies as Record<string, unknown>)[accessCookieName];
      return typeof value === 'string' ? value : null;
    };
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow('auth.accessSecret', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }
    return user;
  }
}
