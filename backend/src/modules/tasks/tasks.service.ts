import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Task } from '@prisma/client';
import type { AuthUser } from '@core/auth/auth.types';
import { toTaskDto, type TaskDto } from '@common/mappers';
import { PrismaService } from '@core/database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQuery } from './dto/list-tasks.query';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser, query: ListTasksQuery): Promise<TaskDto[]> {
    const where: Prisma.TaskWhereInput = {};

    if (user.role === 'student') {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId: user.id },
        select: { cohortId: true },
      });
      const cohortIds = enrollments.map((e) => e.cohortId);
      if (cohortIds.length === 0) return [];
      where.cohortId = { in: cohortIds };
      where.status = 'published';
    } else if (query.cohortId) {
      where.cohortId = query.cohortId;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(tasks.map((t) => this.serialize(t)));
  }

  async findOne(id: number, user: AuthUser): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found.');

    if (user.role === 'student') {
      // Students may only see published tasks in cohorts they're enrolled in.
      // Hide everything else as 404 so task existence isn't leaked.
      if (task.status !== 'published') {
        throw new NotFoundException('Task not found.');
      }
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_cohortId: { userId: user.id, cohortId: task.cohortId },
        },
      });
      if (!enrollment) {
        throw new NotFoundException('Task not found.');
      }
    }

    return this.serialize(task);
  }

  async create(dto: CreateTaskDto): Promise<TaskDto> {
    const created = await this.prisma.task.create({
      data: {
        cohortId: dto.cohortId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status: dto.status ?? 'draft',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
    return this.serialize(created);
  }

  async update(id: number, dto: UpdateTaskDto): Promise<TaskDto> {
    const exists = await this.prisma.task.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Task not found.');

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status: dto.status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
    return this.serialize(updated);
  }

  async remove(id: number): Promise<void> {
    const exists = await this.prisma.task.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Task not found.');
    await this.prisma.task.delete({ where: { id } });
  }

  private async serialize(task: Task): Promise<TaskDto> {
    const submissionCount = await this.prisma.submission.count({
      where: { taskId: task.id },
    });
    return toTaskDto(task, submissionCount);
  }
}
