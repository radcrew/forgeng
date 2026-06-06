import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationStatus, Role, type User } from '@prisma/client';
import type { AppConfiguration } from '@config';
import { PrismaService } from '@core/database/prisma.service';
import { toApplicationDto, type ApplicationDto } from '@common/mappers';
import { splitName } from '@common/string';
import { MailService } from '@core/mail';
import { NotificationsService } from '@modules/notifications/notifications.service';
import {
  applicationAcceptedEmail,
  applicationRejectedEmail,
} from '@modules/notifications/templates';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQuery } from './dto/list-applications.query';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

const DEFAULT_PAGE_SIZE = 20;

export interface PaginatedApplications {
  items: ApplicationDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApplicationStats {
  pending: number;
  reviewing: number;
  accepted: number;
  rejected: number;
  total: number;
}

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  async list(query: ListApplicationsQuery): Promise<PaginatedApplications> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const where = query.status ? { status: query.status } : undefined;

    const [rows, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.application.count({ where }),
    ]);

    return { items: rows.map(toApplicationDto), total, page, pageSize };
  }

  async create(user: User, dto: CreateApplicationDto): Promise<ApplicationDto> {
    const existing = await this.prisma.application.findUnique({
      where: { userId: user.id },
    });
    if (existing) {
      throw new ConflictException('You have already submitted an application.');
    }

    const { firstName, lastName } = splitName(user.name, user.email);
    const created = await this.prisma.application.create({
      data: {
        userId: user.id,
        // Denormalized snapshot of the applicant's identity at submit time.
        email: user.email,
        firstName,
        lastName,
        motivation: dto.motivation,
        background: dto.background,
        experience: dto.experience,
        linkedin: dto.linkedin,
        twitter: dto.twitter,
        facebook: dto.facebook,
        github: dto.github,
        portfolio: dto.portfolio,
        telegram: dto.telegram,
        whatsapp: dto.whatsapp,
        address: dto.address,
        videoUrl: dto.videoUrl,
        wallets:
          dto.wallets?.map((w) => ({ chain: w.chain, address: w.address })) ??
          [],
        status: 'pending',
      },
    });

    // Best-effort: a notification failure must never break the application.
    try {
      await this.notifications.notifyApplicationReceived({
        applicantName: `${firstName} ${lastName}`.trim() || user.email,
      });
    } catch (err) {
      this.logger.error(
        'Failed to notify admins of application',
        err instanceof Error ? err.stack : String(err),
      );
    }

    return toApplicationDto(created);
  }

  /** The current user's own application, or null if they haven't applied. */
  async findMine(userId: number): Promise<ApplicationDto | null> {
    const app = await this.prisma.application.findUnique({
      where: { userId },
    });
    return app ? toApplicationDto(app) : null;
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: {
          status: dto.status,
          reviewerNote: dto.reviewerNote,
          cohortId: dto.cohortId,
        },
      });

      // Accepting an application turns the applicant into a student and, if a
      // cohort was chosen, enrolls them. Legacy anonymous rows (no userId) just
      // change status — there is no account to promote.
      if (app.status === ApplicationStatus.accepted && app.userId) {
        await tx.user.updateMany({
          where: { id: app.userId, role: Role.applicant },
          data: { role: Role.student },
        });
        if (app.cohortId) {
          await tx.enrollment.upsert({
            where: {
              userId_cohortId: { userId: app.userId, cohortId: app.cohortId },
            },
            create: { userId: app.userId, cohortId: app.cohortId },
            update: {},
          });
        }
      }

      return app;
    });

    const applicantName = `${updated.firstName} ${updated.lastName}`.trim();
    const frontendUrl = this.config.get('frontendUrl', { infer: true });

    if (updated.status === ApplicationStatus.accepted) {
      try {
        await this.mail.send({
          to: updated.email,
          ...applicationAcceptedEmail({
            applicantName,
            reviewerNote: updated.reviewerNote,
            dashboardUrl: `${frontendUrl}/student/dashboard`,
          }),
        });
      } catch (err) {
        this.logger.error(
          `Failed to send acceptance email to ${updated.email}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    } else if (updated.status === ApplicationStatus.rejected) {
      try {
        await this.mail.send({
          to: updated.email,
          ...applicationRejectedEmail({
            applicantName,
            reviewerNote: updated.reviewerNote,
          }),
        });
      } catch (err) {
        this.logger.error(
          `Failed to send rejection email to ${updated.email}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

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
