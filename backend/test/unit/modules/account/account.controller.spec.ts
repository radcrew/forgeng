import { BadRequestException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { AccountController } from '@modules/account/account.controller';
import { AvatarService } from '@modules/account/avatar.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 2,
    email: 'ada@example.com',
    name: 'Ada',
    role: 'student',
    bio: null,
    githubUrl: null,
    avatarUrl: null,
    emailVerified: true,
    registrationIp: null,
    registrationCountry: null,
    registrationCity: null,
    createdAt: DATE,
    ...overrides,
  } as User;
}

const user = makeUser();

describe('AccountController', () => {
  let controller: AccountController;
  let prisma: {
    application: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    user: { update: jest.Mock };
    enrollment: { findMany: jest.Mock };
  };
  let avatar: { upload: jest.Mock };

  beforeEach(() => {
    prisma = {
      application: {
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(1),
      },
      user: { update: jest.fn().mockResolvedValue(makeUser()) },
      enrollment: { findMany: jest.fn().mockResolvedValue([]) },
    };
    avatar = { upload: jest.fn().mockResolvedValue({ id: 2 }) };
    controller = new AccountController(
      prisma as unknown as PrismaService,
      avatar as unknown as AvatarService,
    );
  });

  describe('getMe', () => {
    it('returns the mapped user with their social fields', async () => {
      prisma.application.findUnique.mockResolvedValue({
        github: 'https://github.com/ada',
      });
      const dto = await controller.getMe(user);
      expect(dto.id).toBe(2);
      expect(prisma.application.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 2 } }),
      );
    });
  });

  describe('getWallets', () => {
    it('returns an empty array when the applicant has none', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      await expect(controller.getWallets(user)).resolves.toEqual({
        wallets: [],
      });
    });

    it('returns the stored wallets', async () => {
      prisma.application.findUnique.mockResolvedValue({
        wallets: [{ chain: 'evm', address: '0xabc' }],
      });
      const result = await controller.getWallets(user);
      expect(result.wallets).toHaveLength(1);
    });
  });

  describe('updateWallets', () => {
    it('persists the normalized wallet list', async () => {
      const dto = {
        wallets: [{ chain: 'evm', address: '0xabc' }],
      } as never;

      const result = await controller.updateWallets(user, dto);

      expect(prisma.application.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 2 } }),
      );
      expect(result.wallets).toEqual([{ chain: 'evm', address: '0xabc' }]);
    });

    it('refuses to report a wallet as saved when there is no application', async () => {
      prisma.application.updateMany.mockResolvedValue({ count: 0 });
      const dto = {
        wallets: [{ chain: 'evm', address: '0xabc' }],
      } as never;

      await expect(controller.updateWallets(user, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('updateProfile', () => {
    it('updates only the user fields when no socials are present', async () => {
      await controller.updateProfile(user, { name: 'Ada B' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 2 }, data: { name: 'Ada B' } }),
      );
      // No social field provided, so the application is not written.
      expect(prisma.application.update).not.toHaveBeenCalled();
    });

    it('updates the application socials when a social field is present', async () => {
      await controller.updateProfile(user, {
        name: 'Ada',
        github: 'https://github.com/ada',
      });

      expect(prisma.application.update).toHaveBeenCalledTimes(1);
      expect(prisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 2 },
          data: expect.objectContaining({
            github: 'https://github.com/ada',
          }) as unknown,
        }),
      );
    });

    it('refuses social links without an application and creates none', async () => {
      prisma.application.count.mockResolvedValue(0);

      await expect(
        controller.updateProfile(user, { github: 'https://github.com/ada' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.application.update).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('saves the name without an application when no links are given', async () => {
      prisma.application.count.mockResolvedValue(0);

      await controller.updateProfile(user, { name: 'Ada B' });

      expect(prisma.user.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('uploadAvatar', () => {
    it('delegates to the avatar service', async () => {
      const file = { buffer: Buffer.from('img') } as never;
      await controller.uploadAvatar(user, file);
      expect(avatar.upload).toHaveBeenCalledWith(user, file);
    });
  });

  describe('getEnrollments', () => {
    it('maps enrollments with their cohort', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        {
          id: 1,
          enrolledAt: DATE,
          cohort: {
            id: 3,
            name: 'Spring',
            status: 'active',
            capacity: 30,
            description: null,
            startDate: null,
            endDate: null,
            createdAt: DATE,
            _count: { enrollments: 5 },
          },
        },
      ]);

      const result = await controller.getEnrollments(user);

      expect(result).toHaveLength(1);
      expect(result[0].cohort.id).toBe(3);
    });
  });
});
