import { randomBytes, createHash } from 'node:crypto';
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
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
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
    private readonly email: EmailService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: UserDto }> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await this.password.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        emailVerified: false,
      },
    });

    await this.sendVerificationEmail(user);
    return { user: toUserDto(user) };
  }

  async login(dto: LoginDto, ctx: RequestContext): Promise<AuthResult> {
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
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash },
    });
    if (
      !record ||
      record.type !== VerificationTokenType.email_verify ||
      record.usedAt
    ) {
      throw new BadRequestException('Verification link is invalid or used.');
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Verification link expired.');
    }

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
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
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash },
    });
    if (
      !record ||
      record.type !== VerificationTokenType.password_reset ||
      record.usedAt
    ) {
      throw new BadRequestException('Reset link is invalid or already used.');
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Reset link expired.');
    }

    const passwordHash = await this.password.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        // Completing a reset proves the user controls the inbox, so confirm
        // the email too (covers OAuth-only users adding a password).
        data: { passwordHash, emailVerified: true },
      }),
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Invalidate every active session — a password change should sign out
    // anyone holding old refresh tokens.
    await this.tokens.revokeAllForUser(record.userId);
  }

  async signInWithOAuth(
    profile: OAuthProfileDto,
    ctx: RequestContext,
  ): Promise<AuthResult> {
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
        dbUser = await tx.user.create({
          data: {
            email,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            emailVerified: profile.emailVerified,
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
    const rawToken = randomBytes(32).toString('base64url');
    const ttlMinutes = this.config.getOrThrow('auth.verifyTokenTtlMinutes', {
      infer: true,
    });
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Invalidate any previous email_verify tokens for this user.
    await this.prisma.$transaction([
      this.prisma.verificationToken.updateMany({
        where: {
          userId: user.id,
          type: VerificationTokenType.email_verify,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      this.prisma.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(rawToken),
          type: VerificationTokenType.email_verify,
          expiresAt,
        },
      }),
    ]);

    const base = this.config.getOrThrow('auth.emailVerifyRedirect', {
      infer: true,
    });
    const verifyUrl = `${base}?token=${encodeURIComponent(rawToken)}`;
    await this.email.sendVerificationEmail(user.email, verifyUrl);
  }

  private async sendPasswordResetEmail(user: User): Promise<void> {
    const rawToken = randomBytes(32).toString('base64url');
    const ttlMinutes = this.config.getOrThrow('auth.passwordResetTtlMinutes', {
      infer: true,
    });
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Invalidate any previous password_reset tokens for this user.
    await this.prisma.$transaction([
      this.prisma.verificationToken.updateMany({
        where: {
          userId: user.id,
          type: VerificationTokenType.password_reset,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      this.prisma.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(rawToken),
          type: VerificationTokenType.password_reset,
          expiresAt,
        },
      }),
    ]);

    const base = this.config.getOrThrow('auth.passwordResetRedirect', {
      infer: true,
    });
    const resetUrl = `${base}?token=${encodeURIComponent(rawToken)}`;
    await this.email.sendPasswordResetEmail(user.email, resetUrl);
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
