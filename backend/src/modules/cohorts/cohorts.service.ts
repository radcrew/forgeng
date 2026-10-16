import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Cohort } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import {
  toCohortDto,
  toEnrollmentDto,
  type CohortDto,
  type EnrollmentDto,
} from '../../common/mappers';
import { assertCohortHasRoom } from './cohort-capacity';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { EnrollDto } from './dto/enroll.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';

@Injectable()
export class CohortsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CohortDto[]> {
    const cohorts = await this.prisma.cohort.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(cohorts.map((c) => this.serialize(c)));
  }

  async findOne(id: number): Promise<CohortDto> {
    const cohort = await this.prisma.cohort.findUnique({ where: { id } });
    if (!cohort) throw new NotFoundException('Cohort not found.');
    return this.serialize(cohort);
  }

  async create(dto: CreateCohortDto): Promise<CohortDto> {
    this.assertDateOrder(
      dto.startDate ? new Date(dto.startDate) : null,
      dto.endDate ? new Date(dto.endDate) : null,
    );
    const created = await this.prisma.cohort.create({
      data: {
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity,
        status: dto.status ?? 'draft',
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    return this.serialize(created);
  }

  async update(id: number, dto: UpdateCohortDto): Promise<CohortDto> {
    const exists = await this.prisma.cohort.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Cohort not found.');

    this.assertDateOrder(
      dto.startDate ? new Date(dto.startDate) : exists.startDate,
      dto.endDate ? new Date(dto.endDate) : exists.endDate,
    );
    if (dto.capacity !== undefined) {
      const enrolled = await this.prisma.enrollment.count({
        where: { cohortId: id },
      });
      if (dto.capacity < enrolled) {
        throw new BadRequestException(
          `${enrolled} students are already enrolled. Set the capacity to at least ${enrolled}.`,
        );
      }
    }

    const updated = await this.prisma.cohort.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    return this.serialize(updated);
  }

  async remove(id: number): Promise<void> {
    const exists = await this.prisma.cohort.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Cohort not found.');
    await this.prisma.cohort.delete({ where: { id } });
  }

  async enrollments(cohortId: number): Promise<EnrollmentDto[]> {
    const items = await this.prisma.enrollment.findMany({
      where: { cohortId },
      include: { user: true },
      orderBy: { enrolledAt: 'asc' },
    });
    return items.map((e) => toEnrollmentDto(e, e.user));
  }

  async enroll(cohortId: number, dto: EnrollDto): Promise<EnrollmentDto> {
    const enrollment = await this.prisma.$transaction(async (tx) => {
      await assertCohortHasRoom(tx, cohortId);
      return tx.enrollment.create({
        data: { cohortId, userId: dto.userId },
        include: { user: true },
      });
    });
    return toEnrollmentDto(enrollment, enrollment.user);
  }

  /**
   * Removes a student from a cohort. Their submissions stay. The cohort is
   * also cleared on their application, so saving that application later
   * doesn't enroll them again.
   */
  async unenroll(cohortId: number, userId: number): Promise<void> {
    const [removed] = await this.prisma.$transaction([
      this.prisma.enrollment.deleteMany({ where: { cohortId, userId } }),
      this.prisma.application.updateMany({
        where: { cohortId, userId },
        data: { cohortId: null },
      }),
    ]);
    if (removed.count === 0) {
      throw new NotFoundException('This student is not in the cohort.');
    }
  }

  private assertDateOrder(start: Date | null, end: Date | null): void {
    if (start && end && end < start) {
      throw new BadRequestException(
        'The end date must be on or after the start date.',
      );
    }
  }

  private async serialize(cohort: Cohort): Promise<CohortDto> {
    const enrolledCount = await this.prisma.enrollment.count({
      where: { cohortId: cohort.id },
    });
    return toCohortDto(cohort, enrolledCount);
  }
}
