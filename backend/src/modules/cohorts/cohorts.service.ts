import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Cohort } from '@prisma/client';
import type { AuthUser } from '../../core/auth/auth.types';
import { PrismaService } from '../../core/database/prisma.service';
import { SlackChannelsService } from '../../core/slack';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly slackChannels: SlackChannelsService,
  ) {}

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

  /**
   * Creates a cohort. Without a Slack channel ID, it also creates a private
   * Slack channel for the cohort, when Slack is set up.
   */
  async create(dto: CreateCohortDto, admin: AuthUser): Promise<CohortDto> {
    this.assertDateOrder(
      dto.startDate ? new Date(dto.startDate) : null,
      dto.endDate ? new Date(dto.endDate) : null,
    );
    await this.assertSlackChannelUsable(dto.slackChannelId);
    const created = await this.prisma.cohort.create({
      data: {
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity,
        status: dto.status ?? 'draft',
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        slackChannelId: dto.slackChannelId ?? undefined,
      },
    });
    // After the cohort is saved and the admin has the answer, so a Slack
    // problem never blocks or slows it.
    if (!created.slackChannelId) {
      this.slackChannels.createForCohortInBackground(created, admin.id);
    }
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

    // Read before the change, so the students can be moved after it.
    const channelChanged =
      dto.slackChannelId !== undefined &&
      dto.slackChannelId !== exists.slackChannelId;
    if (channelChanged)
      await this.assertSlackChannelUsable(dto.slackChannelId, id);
    const students = channelChanged
      ? await this.slackChannels.linkedStudents(id)
      : [];

    const updated = await this.prisma.cohort.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        // Left out keeps the channel, null removes it.
        slackChannelId: dto.slackChannelId,
      },
    });
    if (channelChanged) {
      this.slackChannels.moveInBackground(
        students,
        exists.slackChannelId,
        updated.slackChannelId,
      );
    }
    return this.serialize(updated);
  }

  async remove(id: number): Promise<void> {
    const exists = await this.prisma.cohort.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Cohort not found.');
    // Read before the delete, which also deletes the enrollments.
    const students = exists.slackChannelId
      ? await this.slackChannels.linkedStudents(id)
      : [];
    await this.prisma.cohort.delete({ where: { id } });
    this.slackChannels.moveInBackground(students, exists.slackChannelId, null);
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
    this.slackChannels.syncInBackground(dto.userId, [cohortId]);
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
    this.slackChannels.syncInBackground(userId, [cohortId]);
  }

  /**
   * Gives a clear message when another cohort already uses the channel, or
   * when Slack can't use it. The unique index also refuses a shared
   * channel, for two saves at the same moment.
   */
  private async assertSlackChannelUsable(
    channelId: string | null | undefined,
    cohortId?: number,
  ): Promise<void> {
    if (!channelId) return;
    const other = await this.prisma.cohort.findFirst({
      where: {
        slackChannelId: channelId,
        ...(cohortId ? { id: { not: cohortId } } : {}),
      },
      select: { name: true },
    });
    if (other) {
      throw new ConflictException(
        `The cohort "${other.name}" already uses this Slack channel. Each cohort needs its own channel.`,
      );
    }
    // For example a mistyped ID, or a channel the app wasn't invited to.
    const problem = await this.slackChannels.channelProblem(channelId);
    if (problem) throw new BadRequestException(problem);
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
