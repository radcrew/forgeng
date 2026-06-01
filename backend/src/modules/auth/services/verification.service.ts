import { randomBytes } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, VerificationTokenType } from '@prisma/client';

import type { AppConfiguration } from '@config';
import { PrismaService } from '@core/database/prisma.service';
import { hashToken } from '@common/crypto';

/**
 * Owns the `verificationToken` table: issuing single-use, hashed tokens for
 * email verification / password reset, and spending them atomically alongside
 * the side effect they authorize.
 */
@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  /**
   * Issue a fresh token of `type`, invalidating any prior unused ones for the
   * user. Returns the raw token (only its hash is persisted).
   */
  async issue(userId: number, type: VerificationTokenType): Promise<string> {
    const rawToken = randomBytes(32).toString('base64url');
    const ttlMinutes =
      type === VerificationTokenType.email_verify
        ? this.config.getOrThrow('auth.verifyTokenTtlMinutes', { infer: true })
        : this.config.getOrThrow('auth.passwordResetTtlMinutes', {
            infer: true,
          });
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.verificationToken.updateMany({
        where: { userId, type, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.verificationToken.create({
        data: { userId, tokenHash: hashToken(rawToken), type, expiresAt },
      }),
    ]);

    return rawToken;
  }

  /**
   * Validate `rawToken` for `type`, mark it used, and run `apply` in the same
   * transaction so spending the token and its side effect commit atomically.
   */
  async consume<T>(
    rawToken: string,
    type: VerificationTokenType,
    apply: (tx: Prisma.TransactionClient, userId: number) => Promise<T>,
  ): Promise<T> {
    const isVerify = type === VerificationTokenType.email_verify;
    const tokenHash = hashToken(rawToken);

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.verificationToken.findUnique({
        where: { tokenHash },
      });
      if (!record || record.type !== type || record.usedAt) {
        throw new BadRequestException(
          isVerify
            ? 'Verification link is invalid or used.'
            : 'Reset link is invalid or already used.',
        );
      }
      if (record.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException(
          isVerify ? 'Verification link expired.' : 'Reset link expired.',
        );
      }

      await tx.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });

      return apply(tx, record.userId);
    });
  }
}
