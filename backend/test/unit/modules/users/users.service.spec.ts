import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Payment, User } from '@prisma/client';
import { MailService } from '@core/mail';
import { PrismaService } from '@core/database/prisma.service';
import { UsersService } from '@modules/users/users.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    role: 'student',
    createdAt: DATE,
    ...overrides,
  } as User;
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 100,
    userId: 1,
    amount: { toString: () => '250' },
    currency: 'USDC',
    txLink: null,
    note: null,
    paidAt: DATE,
    ...overrides,
  } as unknown as Payment;
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    payment: { create: jest.Mock };
  };
  let mail: { send: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      payment: { create: jest.fn() },
    };
    mail = { send: jest.fn().mockResolvedValue(undefined) };
    const config = {
      get: jest.fn().mockReturnValue('https://app.forgeng.test'),
    };

    service = new UsersService(
      prisma as unknown as PrismaService,
      mail as unknown as MailService,
      config as unknown as ConfigService,
    );
  });

  describe('getById', () => {
    it('throws NotFoundException when the user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getById(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the mapped user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      const dto = await service.getById(1);
      expect(dto.id).toBe(1);
    });
  });

  describe('recordPayment', () => {
    it('throws NotFoundException when the user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.recordPayment(1, { amount: '250', currency: 'USDC' } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates a payment and emails the student', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.payment.create.mockResolvedValue(makePayment());

      const dto = await service.recordPayment(1, {
        amount: '250',
        currency: 'USDC',
      } as never);

      expect(dto.amount).toBe('250');
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ada@example.com' }),
      );
    });
  });

  describe('list', () => {
    it('paginates and reports total with defaults', async () => {
      prisma.user.findMany.mockResolvedValue([makeUser(), makeUser({ id: 2 })]);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.list({});

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.items).toHaveLength(2);
    });

    it('filters by role when provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.list({ role: 'admin' } as never);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'admin' } }),
      );
    });
  });

  describe('updateRole', () => {
    it('throws NotFoundException when the user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateRole(1, { role: 'admin' } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the role of an existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.user.update.mockResolvedValue(makeUser({ role: 'admin' }));

      const dto = await service.updateRole(1, { role: 'admin' } as never);

      expect(dto.role).toBe('admin');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { role: 'admin' } }),
      );
    });
  });

  describe('notifyWalletMissing', () => {
    it('throws NotFoundException when the user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.notifyWalletMissing(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('emails the user and reports sent', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      const result = await service.notifyWalletMissing(1);

      expect(result).toEqual({ sent: true });
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ada@example.com' }),
      );
    });
  });
});
