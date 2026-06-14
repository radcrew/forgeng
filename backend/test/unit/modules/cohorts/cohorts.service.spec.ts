import { NotFoundException } from '@nestjs/common';
import type { Cohort, Enrollment, User } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { CohortsService } from '@modules/cohorts/cohorts.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeCohort(overrides: Partial<Cohort> = {}): Cohort {
  return {
    id: 3,
    name: 'Spring 2026',
    description: null,
    capacity: 30,
    status: 'draft',
    startDate: null,
    endDate: null,
    createdAt: DATE,
    ...overrides,
  } as Cohort;
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    clerkId: null,
    email: 'ada@example.com',
    emailVerified: true,
    name: 'Ada Lovelace',
    role: 'student',
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

describe('CohortsService', () => {
  let service: CohortsService;
  let prisma: {
    cohort: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    enrollment: {
      findMany: jest.Mock;
      create: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      cohort: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      enrollment: {
        findMany: jest.fn(),
        create: jest.fn(),
        // serialize() counts enrollments for every cohort it maps.
        count: jest.fn().mockResolvedValue(0),
      },
    };

    service = new CohortsService(prisma as unknown as PrismaService);
  });

  describe('list', () => {
    it('returns serialized cohorts newest first', async () => {
      prisma.cohort.findMany.mockResolvedValue([
        makeCohort(),
        makeCohort({ id: 4 }),
      ]);
      prisma.enrollment.count.mockResolvedValue(5);

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(prisma.cohort.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result[0].enrolledCount).toBe(5);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the cohort does not exist', async () => {
      prisma.cohort.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the serialized cohort when found', async () => {
      prisma.cohort.findUnique.mockResolvedValue(makeCohort());
      prisma.enrollment.count.mockResolvedValue(2);

      const dto = await service.findOne(3);

      expect(dto.id).toBe(3);
      expect(dto.enrolledCount).toBe(2);
    });
  });

  describe('create', () => {
    it('defaults status to draft when omitted', async () => {
      prisma.cohort.create.mockResolvedValue(makeCohort());

      await service.create({ name: 'Spring 2026', capacity: 30 });

      const data = (
        prisma.cohort.create.mock.calls[0] as [{ data: { status: string } }]
      )[0].data;
      expect(data.status).toBe('draft');
    });

    it('parses provided start and end dates', async () => {
      prisma.cohort.create.mockResolvedValue(makeCohort());

      await service.create({
        name: 'Spring 2026',
        capacity: 30,
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: '2026-05-01T00:00:00.000Z',
      });

      const data = (
        prisma.cohort.create.mock.calls[0] as [
          { data: { startDate: Date; endDate: Date } },
        ]
      )[0].data;
      expect(data.startDate).toBeInstanceOf(Date);
      expect(data.endDate).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when updating a missing cohort', async () => {
      prisma.cohort.findUnique.mockResolvedValue(null);
      await expect(service.update(3, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.cohort.update).not.toHaveBeenCalled();
    });

    it('updates an existing cohort', async () => {
      prisma.cohort.findUnique.mockResolvedValue(makeCohort());
      prisma.cohort.update.mockResolvedValue(makeCohort({ name: 'Renamed' }));

      const dto = await service.update(3, { name: 'Renamed' });

      expect(dto.name).toBe('Renamed');
      expect(prisma.cohort.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 3 } }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when removing a missing cohort', async () => {
      prisma.cohort.findUnique.mockResolvedValue(null);
      await expect(service.remove(3)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.cohort.delete).not.toHaveBeenCalled();
    });

    it('deletes an existing cohort', async () => {
      prisma.cohort.findUnique.mockResolvedValue(makeCohort());

      await service.remove(3);

      expect(prisma.cohort.delete).toHaveBeenCalledWith({ where: { id: 3 } });
    });
  });

  describe('enrollments', () => {
    it('maps enrollments with their included user', async () => {
      const enrollment = {
        id: 1,
        cohortId: 3,
        userId: 1,
        enrolledAt: DATE,
        user: makeUser(),
      } as unknown as Enrollment & { user: User };
      prisma.enrollment.findMany.mockResolvedValue([enrollment]);

      const result = await service.enrollments(3);

      expect(result).toHaveLength(1);
      expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cohortId: 3 } }),
      );
    });
  });

  describe('enroll', () => {
    it('creates an enrollment for the given user', async () => {
      prisma.enrollment.create.mockResolvedValue({
        id: 1,
        cohortId: 3,
        userId: 1,
        enrolledAt: DATE,
        user: makeUser(),
      });

      const dto = await service.enroll(3, { userId: 1 });

      expect(dto).toBeDefined();
      expect(prisma.enrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { cohortId: 3, userId: 1 } }),
      );
    });
  });
});
