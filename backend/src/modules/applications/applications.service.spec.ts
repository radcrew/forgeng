import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { MailService } from '@core/mail';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { ApplicationsService } from './applications.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    clerkId: null,
    email: 'ada@example.com',
    emailVerified: true,
    name: 'Ada Lovelace',
    role: 'applicant',
    bio: null,
    githubUrl: null,
    avatarUrl: null,
    registrationIp: null,
    registrationCountry: null,
    registrationCity: null,
    createdAt: DATE,
    ...overrides,
  } as User;
}

type ApplicationRow = {
  id: number;
  userId: number | null;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  motivation: string | null;
  background: string | null;
  experience: string | null;
  linkedin: string | null;
  twitter: string | null;
  facebook: string | null;
  github: string | null;
  portfolio: string | null;
  telegram: string | null;
  whatsapp: string | null;
  country: string | null;
  videoUrl: string | null;
  wallets: unknown;
  reviewerNote: string | null;
  cohortId: number | null;
  createdAt: Date;
};

function makeApplicationRow(
  overrides: Partial<ApplicationRow> = {},
): ApplicationRow {
  return {
    id: 10,
    userId: 1,
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    status: 'pending',
    motivation: 'I want to learn',
    background: null,
    experience: null,
    linkedin: null,
    twitter: null,
    facebook: null,
    github: null,
    portfolio: null,
    telegram: null,
    whatsapp: null,
    country: null,
    videoUrl: null,
    wallets: [],
    reviewerNote: 'internal note',
    cohortId: null,
    createdAt: DATE,
    ...overrides,
  };
}

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: {
    application: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      groupBy: jest.Mock;
    };
  };
  let notifications: { notifyApplicationReceived: jest.Mock };
  let mail: { send: jest.Mock };

  beforeEach(() => {
    prisma = {
      application: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        groupBy: jest.fn(),
      },
    };
    notifications = {
      notifyApplicationReceived: jest.fn().mockResolvedValue(undefined),
    };
    mail = { send: jest.fn().mockResolvedValue(undefined) };
    const config = {
      get: jest.fn().mockReturnValue('https://app.example.com'),
    };

    service = new ApplicationsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      mail as unknown as MailService,
      config as unknown as ConfigService<never, true>,
    );
  });

  describe('list', () => {
    it('paginates with defaults and maps rows to DTOs', async () => {
      prisma.application.findMany.mockResolvedValue([makeApplicationRow()]);
      prisma.application.count.mockResolvedValue(1);

      const result = await service.list({});

      expect(result.page).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(10);
      // No status filter means an undefined where clause.
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('filters by status when provided', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      prisma.application.count.mockResolvedValue(0);

      await service.list({ status: 'accepted' } as never);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'accepted' } }),
      );
    });
  });

  describe('create', () => {
    it('rejects a duplicate application with a ConflictException', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());

      await expect(
        service.create(makeUser(), { motivation: 'hi' } as never),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.application.create).not.toHaveBeenCalled();
    });

    it('creates an application and notifies admins', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      prisma.application.create.mockResolvedValue(makeApplicationRow());

      const dto = await service.create(makeUser(), {
        motivation: 'hi',
      } as never);

      expect(dto.id).toBe(10);
      expect(notifications.notifyApplicationReceived).toHaveBeenCalledTimes(1);
    });

    it('still creates the application when the admin notification fails', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      prisma.application.create.mockResolvedValue(makeApplicationRow());
      notifications.notifyApplicationReceived.mockRejectedValue(
        new Error('smtp down'),
      );
      // The failure is logged best-effort; silence it to keep test output clean.
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      const dto = await service.create(makeUser(), {
        motivation: 'hi',
      } as never);

      expect(dto.id).toBe(10);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('findMine', () => {
    it('returns null when the user has no application', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      await expect(service.findMine(1)).resolves.toBeNull();
    });

    it('strips the internal reviewerNote from the applicant view', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
      const dto = await service.findMine(1);
      expect(dto).not.toBeNull();
      expect(dto?.reviewerNote).toBeNull();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the application is missing', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the application DTO including the reviewer note', async () => {
      prisma.application.findUnique.mockResolvedValue(makeApplicationRow());
      const dto = await service.findOne(10);
      expect(dto.reviewerNote).toBe('internal note');
    });
  });

  describe('stats', () => {
    it('aggregates groupBy rows into per-status counts and a total', async () => {
      prisma.application.groupBy.mockResolvedValue([
        { status: 'pending', _count: { _all: 3 } },
        { status: 'accepted', _count: { _all: 2 } },
        { status: 'rejected', _count: { _all: 1 } },
      ]);

      await expect(service.stats()).resolves.toEqual({
        pending: 3,
        accepted: 2,
        rejected: 1,
        total: 6,
      });
    });

    it('returns all-zero counts when there are no applications', async () => {
      prisma.application.groupBy.mockResolvedValue([]);
      await expect(service.stats()).resolves.toEqual({
        pending: 0,
        accepted: 0,
        rejected: 0,
        total: 0,
      });
    });
  });
});
