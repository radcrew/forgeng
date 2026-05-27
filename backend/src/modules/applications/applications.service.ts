import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { toApplicationDto, type ApplicationDto } from '../../common/mappers';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

export interface ApplicationStats {
  pending: number;
  reviewing: number;
  accepted: number;
  rejected: number;
  total: number;
}

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: ApplicationStatus): Promise<ApplicationDto[]> {
    const rows = await this.prisma.application.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toApplicationDto);
  }

  async create(dto: CreateApplicationDto): Promise<ApplicationDto> {
    const created = await this.prisma.application.create({
      data: { ...dto, status: 'pending' },
    });
    return toApplicationDto(created);
  }

  async findOne(id: number): Promise<ApplicationDto> {
    const app = await this.prisma.application.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found.');
    return toApplicationDto(app);
  }

  async updateStatus(
    id: number,
    dto: UpdateApplicationStatusDto,
  ): Promise<ApplicationDto> {
    const exists = await this.prisma.application.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Application not found.');

    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        status: dto.status,
        reviewerNote: dto.reviewerNote,
        cohortId: dto.cohortId,
      },
    });
    return toApplicationDto(updated);
  }

  async stats(): Promise<ApplicationStats> {
    const rows = await this.prisma.application.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const stats: ApplicationStats = {
      pending: 0,
      reviewing: 0,
      accepted: 0,
      rejected: 0,
      total: 0,
    };
    for (const row of rows) {
      stats[row.status] = row._count._all;
      stats.total += row._count._all;
    }
    return stats;
  }
}
