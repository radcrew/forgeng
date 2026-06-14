import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerificationTokenType } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { hashToken } from '@common/crypto';
import { VerificationService } from '@modules/auth/services/verification.service';

describe('VerificationService', () => {
  let service: VerificationService;
  let prisma: {
    verificationToken: {
      updateMany: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      verificationToken: {
        updateMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      // issue() passes an array; consume() passes a callback.
      $transaction: jest.fn((arg: unknown) =>
        typeof arg === 'function'
          ? (arg as (tx: unknown) => unknown)(prisma)
          : Promise.all(arg as unknown[]),
      ),
    };
    const config = { getOrThrow: jest.fn().mockReturnValue(30) };

    service = new VerificationService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
  });

  describe('issue', () => {
    it('persists only the hash and returns the raw token', async () => {
      const raw = await service.issue(1, VerificationTokenType.email_verify);

      expect(typeof raw).toBe('string');
      const data = (
        prisma.verificationToken.create.mock.calls[0] as [
          { data: { tokenHash: string } },
        ]
      )[0].data;
      // The stored hash matches hashing the returned raw token.
      expect(data.tokenHash).toBe(hashToken(raw));
      // Prior unused tokens are invalidated first.
      expect(prisma.verificationToken.updateMany).toHaveBeenCalled();
    });
  });

  describe('consume', () => {
    const apply = jest.fn().mockResolvedValue('applied');

    it('rejects an unknown token', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue(null);
      await expect(
        service.consume('raw', VerificationTokenType.email_verify, apply),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a token of the wrong type', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
        type: VerificationTokenType.password_reset,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      await expect(
        service.consume('raw', VerificationTokenType.email_verify, apply),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an already-used token', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
        type: VerificationTokenType.email_verify,
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });
      await expect(
        service.consume('raw', VerificationTokenType.email_verify, apply),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an expired token', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
        type: VerificationTokenType.email_verify,
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(
        service.consume('raw', VerificationTokenType.email_verify, apply),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('marks the token used and runs apply with the userId', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
        type: VerificationTokenType.email_verify,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      const result = await service.consume(
        'raw',
        VerificationTokenType.email_verify,
        apply,
      );

      expect(result).toBe('applied');
      expect(prisma.verificationToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(apply).toHaveBeenCalledWith(prisma, 2);
    });
  });
});
