import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { Cohort, Enrollment, User } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import { SlackChannelsService } from '@core/slack';
import type { AuthUser } from '@core/auth/auth.types';
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
  let slackChannels: {
    syncInBackground: jest.Mock;
    linkedStudents: jest.Mock;
    moveInBackground: jest.Mock;
    createForCohortInBackground: jest.Mock;
  };
  let prisma: {
    cohort: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    enrollment: {
      findMany: jest.Mock;
      create: jest.Mock;
      count: jest.Mock;
      deleteMany: jest.Mock;
    };
    application: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      cohort: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      enrollment: {
        findMany: jest.fn(),
        create: jest.fn(),
        // serialize() counts enrollments for every cohort it maps.
        count: jest.fn().mockResolvedValue(0),
        deleteMany: jest.fn(),
      },
      application: { updateMany: jest.fn() },
      // Interactive transactions run against the same mocks; the array form
      // just awaits each operation.
      $transaction: jest.fn(
        (arg: Promise<unknown>[] | ((tx: unknown) => Promise<unknown>)) =>
          Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
      ),
    };

    slackChannels = {
      syncInBackground: jest.fn(),
      linkedStudents: jest.fn().mockResolvedValue(['U0ADA']),
      moveInBackground: jest.fn(),
      createForCohortInBackground: jest.fn(),
    };
    service = new CohortsService(
      prisma as unknown as PrismaService,
      slackChannels as unknown as SlackChannelsService,
    );
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

  const ADMIN = { id: 9, role: 'admin' } as AuthUser;
  const create = (dto: Parameters<CohortsService['create']>[0]) =>
    service.create(dto, ADMIN);

  describe('create', () => {
    it('refuses a Slack channel another cohort uses, and names it', async () => {
      prisma.cohort.findFirst.mockResolvedValue({ name: 'Autumn 2026' });

      const result = create({
        name: 'Spring 2026',
        slackChannelId: 'C0123ABCD',
      });

      await expect(result).rejects.toBeInstanceOf(ConflictException);
      await expect(result).rejects.toThrow('"Autumn 2026" already uses');
      expect(prisma.cohort.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slackChannelId: 'C0123ABCD' } }),
      );
      expect(prisma.cohort.create).not.toHaveBeenCalled();
    });

    it('does not look for a channel when none is given', async () => {
      prisma.cohort.create.mockResolvedValue(makeCohort());

      await create({ name: 'Spring 2026' });

      expect(prisma.cohort.findFirst).not.toHaveBeenCalled();
    });

    it('creates the Slack channel after answering, when none is given', async () => {
      prisma.cohort.create.mockResolvedValue(
        makeCohort({ id: 7, name: 'Golang', slackChannelId: null }),
      );

      const dto = await create({ name: 'Golang' });

      expect(slackChannels.createForCohortInBackground).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7, name: 'Golang' }),
        9,
      );
      // The answer doesn't wait for Slack.
      expect(dto.id).toBe(7);
      expect(dto.slackChannelId).toBeNull();
    });

    it('uses the given channel, without creating one', async () => {
      prisma.cohort.create.mockResolvedValue(
        makeCohort({ slackChannelId: 'C0123ABCD' }),
      );

      await create({ name: 'Golang', slackChannelId: 'C0123ABCD' });

      expect(slackChannels.createForCohortInBackground).not.toHaveBeenCalled();
    });

    it('defaults status to draft when omitted', async () => {
      prisma.cohort.create.mockResolvedValue(makeCohort());

      await create({ name: 'Spring 2026', capacity: 30 });

      const data = (
        prisma.cohort.create.mock.calls[0] as [{ data: { status: string } }]
      )[0].data;
      expect(data.status).toBe('draft');
    });

    it('parses provided start and end dates', async () => {
      prisma.cohort.create.mockResolvedValue(makeCohort());

      await create({
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

    it('saves the Slack channel', async () => {
      prisma.cohort.create.mockResolvedValue(makeCohort());

      await create({
        name: 'Spring 2026',
        capacity: 30,
        slackChannelId: 'C0123ABCD',
      });

      const data = (
        prisma.cohort.create.mock.calls[0] as [
          { data: { slackChannelId?: string } },
        ]
      )[0].data;
      expect(data.slackChannelId).toBe('C0123ABCD');
    });

    it('rejects an end date before the start date', async () => {
      await expect(
        create({
          name: 'Spring 2026',
          capacity: 30,
          startDate: '2026-05-01T00:00:00.000Z',
          endDate: '2026-02-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.cohort.create).not.toHaveBeenCalled();
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

    it.each([
      ['saves a new Slack channel', 'C0123ABCD', 'C0123ABCD'],
      ['removes the Slack channel', null, null],
      ['keeps the Slack channel when it is left out', undefined, undefined],
    ])('%s', async (_, sent, saved) => {
      prisma.cohort.findUnique.mockResolvedValue(makeCohort());
      prisma.cohort.update.mockResolvedValue(makeCohort());

      await service.update(3, { slackChannelId: sent });

      const data = (
        prisma.cohort.update.mock.calls[0] as [
          { data: { slackChannelId?: string | null } },
        ]
      )[0].data;
      expect(data.slackChannelId).toBe(saved);
    });

    it.each([
      ['a new channel', 'CNEW', 'CNEW'],
      ['no channel', null, null],
    ])(
      'moves the students when the channel changes to %s',
      async (_, sent, saved) => {
        prisma.cohort.findUnique.mockResolvedValue(
          makeCohort({ slackChannelId: 'COLD' }),
        );
        prisma.cohort.update.mockResolvedValue(
          makeCohort({ slackChannelId: saved }),
        );

        await service.update(3, { slackChannelId: sent });

        expect(slackChannels.linkedStudents).toHaveBeenCalledWith(3);
        expect(slackChannels.moveInBackground).toHaveBeenCalledWith(
          ['U0ADA'],
          'COLD',
          saved,
        );
      },
    );

    it.each([
      ['is left out', undefined],
      ['stays the same', 'COLD'],
    ])('moves nobody when the channel %s', async (_, sent) => {
      prisma.cohort.findUnique.mockResolvedValue(
        makeCohort({ slackChannelId: 'COLD' }),
      );
      prisma.cohort.update.mockResolvedValue(
        makeCohort({ slackChannelId: 'COLD' }),
      );

      await service.update(3, { name: 'Renamed', slackChannelId: sent });

      expect(slackChannels.linkedStudents).not.toHaveBeenCalled();
      expect(slackChannels.moveInBackground).not.toHaveBeenCalled();
    });

    it('refuses a Slack channel another cohort uses', async () => {
      prisma.cohort.findUnique.mockResolvedValue(
        makeCohort({ slackChannelId: 'COLD' }),
      );
      prisma.cohort.findFirst.mockResolvedValue({ name: 'Autumn 2026' });

      await expect(
        service.update(3, { slackChannelId: 'CTAKEN' }),
      ).rejects.toBeInstanceOf(ConflictException);

      // Its own channel doesn't count.
      expect(prisma.cohort.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slackChannelId: 'CTAKEN', id: { not: 3 } },
        }),
      );
      expect(prisma.cohort.update).not.toHaveBeenCalled();
      expect(slackChannels.moveInBackground).not.toHaveBeenCalled();
    });

    it('rejects an end date before the saved start date', async () => {
      prisma.cohort.findUnique.mockResolvedValue(
        makeCohort({ startDate: new Date('2026-05-01T00:00:00.000Z') }),
      );
      await expect(
        service.update(3, { endDate: '2026-02-01T00:00:00.000Z' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.cohort.update).not.toHaveBeenCalled();
    });

    it('rejects a capacity below the number of enrolled students', async () => {
      prisma.cohort.findUnique.mockResolvedValue(makeCohort());
      prisma.enrollment.count.mockResolvedValue(5);
      await expect(service.update(3, { capacity: 4 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.cohort.update).not.toHaveBeenCalled();
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

    it("removes the students from the deleted cohort's channel", async () => {
      prisma.cohort.findUnique.mockResolvedValue(
        makeCohort({ slackChannelId: 'COLD' }),
      );

      await service.remove(3);

      // Read before the delete, which also deletes the enrollments.
      expect(
        slackChannels.linkedStudents.mock.invocationCallOrder[0],
      ).toBeLessThan(prisma.cohort.delete.mock.invocationCallOrder[0]);
      expect(slackChannels.moveInBackground).toHaveBeenCalledWith(
        ['U0ADA'],
        'COLD',
        null,
      );
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
    it('refuses to enroll into a full cohort', async () => {
      prisma.cohort.findUnique.mockResolvedValue({
        ...makeCohort({ capacity: 2 }),
        _count: { enrollments: 2 },
      });

      await expect(service.enroll(3, { userId: 1 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.enrollment.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing cohort', async () => {
      prisma.cohort.findUnique.mockResolvedValue(null);

      await expect(service.enroll(3, { userId: 1 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('creates an enrollment for the given user', async () => {
      prisma.cohort.findUnique.mockResolvedValue({
        ...makeCohort({ capacity: 2 }),
        _count: { enrollments: 1 },
      });
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
      // Adds the student to the cohort's Slack channel.
      expect(slackChannels.syncInBackground).toHaveBeenCalledWith(1, [3]);
    });

    it('touches no Slack channel when the enrollment fails', async () => {
      prisma.cohort.findUnique.mockResolvedValue({
        ...makeCohort({ capacity: 1 }),
        _count: { enrollments: 1 },
      });

      await expect(service.enroll(3, { userId: 1 })).rejects.toThrow();
      expect(slackChannels.syncInBackground).not.toHaveBeenCalled();
    });
  });

  describe('unenroll', () => {
    it('removes the enrollment and clears the cohort on the application', async () => {
      prisma.enrollment.deleteMany.mockResolvedValue({ count: 1 });
      prisma.application.updateMany.mockResolvedValue({ count: 1 });

      await service.unenroll(3, 1);

      expect(prisma.enrollment.deleteMany).toHaveBeenCalledWith({
        where: { cohortId: 3, userId: 1 },
      });
      expect(prisma.application.updateMany).toHaveBeenCalledWith({
        where: { cohortId: 3, userId: 1 },
        data: { cohortId: null },
      });
      // Takes the student out of the cohort's Slack channel.
      expect(slackChannels.syncInBackground).toHaveBeenCalledWith(1, [3]);
    });

    it('throws NotFoundException when the student is not in the cohort', async () => {
      prisma.enrollment.deleteMany.mockResolvedValue({ count: 0 });
      prisma.application.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.unenroll(3, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
