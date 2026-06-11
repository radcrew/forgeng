import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider, type User, VerificationTokenType } from '@prisma/client';

import type { AppConfiguration } from '@config';
import { PrismaService } from '@core/database/prisma.service';
import { toUserDto, type UserDto } from '@common/mappers';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import { EmailService } from './services/email.service';
import { GeoService } from './services/geo.service';
import { PasswordService } from './services/password.service';
import { RegionRestrictionService } from './services/region-restriction.service';
import { TokenService } from './services/token.service';
import { VerificationService } from './services/verification.service';
import type { IssuedTokens } from './types/jwt-payload.types';
import type { OAuthProfileDto } from './strategies/google.strategy';

export interface AuthResult {
  user: UserDto;
  tokens: IssuedTokens;
}

interface RequestContext {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly verification: VerificationService,
    private readonly email: EmailService,
    private readonly geo: GeoService,
    private readonly regionRestriction: RegionRestrictionService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  async register(
    dto: RegisterDto,
    ctx: RequestContext,
  ): Promise<{ user: UserDto }> {
    await this.assertRegionAllowed(ctx.ip);

    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const { country, city } = this.geo.lookup(ctx.ip);
    const passwordHash = await this.password.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        emailVerified: false,
        registrationIp: ctx.ip ?? null,
        registrationCountry: country,
        registrationCity: city,
      },
    });

    await this.sendVerificationEmail(user);
    return { user: toUserDto(user) };
  }

  async login(dto: LoginDto, ctx: RequestContext): Promise<AuthResult> {
    await this.assertRegionAllowed(ctx.ip);

    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const ok = await this.password.verify(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!user.emailVerified) {
      throw new ForbiddenException('Email not verified.');
    }
    const tokens = await this.tokens.issueForUser(user, ctx);
    return { user: toUserDto(user), tokens };
  }

  async refresh(presented: string, ctx: RequestContext): Promise<AuthResult> {
    const result = await this.tokens.rotate(presented, ctx);
    return {
      user: toUserDto(result.user),
      tokens: {
        accessToken: result.accessToken,
        accessExpiresIn: result.accessExpiresIn,
        refreshToken: result.refreshToken,
        refreshExpiresAt: result.refreshExpiresAt,
      },
    };
  }

  async logout(presented: string | undefined): Promise<void> {
    if (!presented) return;
    await this.tokens.revoke(presented);
  }

  async verifyEmail(rawToken: string): Promise<UserDto> {
    const user = await this.verification.consume(
      rawToken,
      VerificationTokenType.email_verify,
      (tx, userId) =>
        tx.user.update({
          where: { id: userId },
          data: { emailVerified: true },
        }),
    );
    return toUserDto(user);
  }

  async resendVerification(email: string): Promise<void> {
    const normalized = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    // Do not leak whether the email exists.
    if (!user || user.emailVerified) return;
    await this.sendVerificationEmail(user);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const normalized = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    // Do not leak whether the email exists.
    if (!user) return;
    await this.sendPasswordResetEmail(user);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const passwordHash = await this.password.hash(newPassword);
    const userId = await this.verification.consume(
      rawToken,
      VerificationTokenType.password_reset,
      async (tx, userId) => {
        await tx.user.update({
          where: { id: userId },
          // Completing a reset proves the user controls the inbox, so confirm
          // the email too (covers OAuth-only users adding a password).
          data: { passwordHash, emailVerified: true },
        });
        return userId;
      },
    );

    // Invalidate every active session — a password change should sign out
    // anyone holding old refresh tokens.
    await this.tokens.revokeAllForUser(userId);
  }

  async signInWithOAuth(
    profile: OAuthProfileDto,
    ctx: RequestContext,
  ): Promise<AuthResult> {
    await this.assertRegionAllowed(ctx.ip);

    if (!profile.email) {
      throw new BadRequestException(
        `${profile.provider} did not return an email; cannot sign in.`,
      );
    }
    const email = profile.email.toLowerCase();
    const provider =
      profile.provider === 'google' ? AuthProvider.google : AuthProvider.github;

    const user = await this.prisma.$transaction(async (tx) => {
      const existingIdentity = await tx.authIdentity.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId: profile.providerAccountId,
          },
        },
        include: { user: true },
      });
      if (existingIdentity) return existingIdentity.user;

      let dbUser = await tx.user.findUnique({ where: { email } });
      if (!dbUser) {
        const { country, city } = this.geo.lookup(ctx.ip);
        dbUser = await tx.user.create({
          data: {
            email,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            emailVerified: profile.emailVerified,
            registrationIp: ctx.ip ?? null,
            registrationCountry: country,
            registrationCity: city,
          },
        });
      } else if (!dbUser.emailVerified && profile.emailVerified) {
        dbUser = await tx.user.update({
          where: { id: dbUser.id },
          data: {
            emailVerified: true,
            name: dbUser.name ?? profile.name,
            avatarUrl: dbUser.avatarUrl ?? profile.avatarUrl,
          },
        });
      }

      await tx.authIdentity.create({
        data: {
          userId: dbUser.id,
          provider,
          providerAccountId: profile.providerAccountId,
          email,
        },
      });
      return dbUser;
    });

    if (!user.emailVerified) {
      throw new ForbiddenException('Email not verified.');
    }
    const tokens = await this.tokens.issueForUser(user, ctx);
    return { user: toUserDto(user), tokens };
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const rawToken = await this.verification.issue(
      user.id,
      VerificationTokenType.email_verify,
    );
    const base = this.config.getOrThrow('auth.emailVerifyRedirect', {
      infer: true,
    });
    const verifyUrl = `${base}?token=${encodeURIComponent(rawToken)}`;
    await this.email.sendVerificationEmail(user.email, verifyUrl);
  }

  private async sendPasswordResetEmail(user: User): Promise<void> {
    const rawToken = await this.verification.issue(
      user.id,
      VerificationTokenType.password_reset,
    );
    const base = this.config.getOrThrow('auth.passwordResetRedirect', {
      infer: true,
    });
    const resetUrl = `${base}?token=${encodeURIComponent(rawToken)}`;
    await this.email.sendPasswordResetEmail(user.email, resetUrl);
  }

  private async assertRegionAllowed(ip: string | undefined): Promise<void> {
    const restriction = await this.regionRestriction.check(ip);
    if (restriction === 'vpn') {
      throw new ForbiddenException({
        code: 'VPN_DETECTED',
        message: 'Please disable your VPN or proxy and try again.',
      });
    }
    if (restriction === 'region') {
      throw new ForbiddenException({
        code: 'REGION_BLOCKED',
        message:
          'This service is only available in the United States and Canada.',
      });
    }
  }
}
