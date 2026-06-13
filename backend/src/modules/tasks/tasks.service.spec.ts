import { NotFoundException } from '@nestjs/common';
import type { Task } from '@prisma/client';
import type { AuthUser } from '@core/auth/auth.types';
import { PrismaService } from '@core/database/prisma.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { TasksService } from './tasks.service';

const DATE = new Date('2026-01-15T10:30:00.000Z');

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 5,
    cohortId: 3,
    title: 'Build a CLI',
    description: null,
    type: 'project',
    status: 'published',
    dueDate: null,
    createdAt: DATE,
    ...overrides,
  } as Task;
}

const admin: AuthUser = { id: 1, role: 'admin' } as AuthUser;
const student: AuthUser = { id: 2, role: 'student' } as AuthUser;

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    enrollment: { findMany: jest.Mock; findUnique: jest.Mock };
    submission: { count: jest.Mock };
  };
  let notifications: { notifyTaskPublished: jest.Mock };

  beforeEach(() => {
    prisma = {
      task: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      enrollment: { findMany: jest.fn(), findUnique: jest.fn() },
      submission: { count: jest.fn().mockResolvedValue(0) },
    };
    notifications = {
      notifyTaskPublished: jest.fn().mockResolvedValue(undefined),
    };

    service = new TasksService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  describe('list', () => {
    it('returns an empty array for a student with no enrollments', async () => {
      prisma.enrollment.findMany.mockResolvedValue([]);

      await expect(service.list(student, {})).resolves.toEqual([]);
      expect(prisma.task.findMany).not.toHaveBeenCalled();
    });

    it('scopes a student to published tasks in their cohorts', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        { cohortId: 3 },
        { cohortId: 7 },
      ]);
      prisma.task.findMany.mockResolvedValue([makeTask()]);

      const result = await service.list(student, {});

      expect(result).toHaveLength(1);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cohortId: { in: [3, 7] }, status: 'published' },
        }),
      );
    });

    it('filters by cohortId for an admin when provided', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.list(admin, { cohortId: 3 });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cohortId: 3 } }),
      );
    });

    it('lists all tasks for an admin with no filter', async () => {
      prisma.task.findMany.mockResolvedValue([makeTask(), makeTask({ id: 6 })]);

      const result = await service.list(admin, {});

      expect(result).toHaveLength(2);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the task does not exist', async () => {
      prisma.task.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99, admin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('hides an unpublished task from a student as a 404', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask({ status: 'draft' }));
      await expect(service.findOne(5, student)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('hides a published task from a non-enrolled student as a 404', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask());
      prisma.enrollment.findUnique.mockResolvedValue(null);
      await expect(service.findOne(5, student)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the task for an enrolled student', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask());
      prisma.enrollment.findUnique.mockResolvedValue({ id: 1 });

      const dto = await service.findOne(5, student);
      expect(dto.id).toBe(5);
    });

    it('returns any task for an admin without enrollment checks', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask({ status: 'draft' }));

      const dto = await service.findOne(5, admin);
      expect(dto.id).toBe(5);
      expect(prisma.enrollment.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('defaults a new task to draft and does not notify', async () => {
      prisma.task.create.mockResolvedValue(makeTask({ status: 'draft' }));

      // Omitting status in the DTO should default the persisted task to draft.
      const dto = await service.create({
        cohortId: 3,
        title: 'x',
        type: 'project',
      } as never);

      expect(dto.status).toBe('draft');
      const createData = (
        prisma.task.create.mock.calls[0] as [{ data: { status: string } }]
      )[0].data;
      expect(createData.status).toBe('draft');
      expect(notifications.notifyTaskPublished).not.toHaveBeenCalled();
    });

    it('notifies students when created already published', async () => {
      prisma.task.create.mockResolvedValue(makeTask({ status: 'published' }));

      await service.create({
        cohortId: 3,
        title: 'x',
        type: 'project',
        status: 'published',
      } as never);

      expect(notifications.notifyTaskPublished).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when updating a missing task', async () => {
      prisma.task.findUnique.mockResolvedValue(null);
      await expect(service.update(5, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('notifies on the draft -> published transition', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask({ status: 'draft' }));
      prisma.task.update.mockResolvedValue(makeTask({ status: 'published' }));

      await service.update(5, { status: 'published' } as never);

      expect(notifications.notifyTaskPublished).toHaveBeenCalledTimes(1);
    });

    it('does not re-notify when the task was already published', async () => {
      prisma.task.findUnique.mockResolvedValue(
        makeTask({ status: 'published' }),
      );
      prisma.task.update.mockResolvedValue(makeTask({ status: 'published' }));

      await service.update(5, { title: 'new title' });

      expect(notifications.notifyTaskPublished).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when removing a missing task', async () => {
      prisma.task.findUnique.mockResolvedValue(null);
      await expect(service.remove(5)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it('deletes an existing task', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask());

      await service.remove(5);

      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });
  });
});
