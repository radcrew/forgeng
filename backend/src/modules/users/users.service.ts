import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '@config';
import {
  toCohortDto,
  toUserDto,
  type ProfileEnrollmentDto,
  type UserDto,
} from '@common/mappers';
import { MailService } from '@core/mail';
import { PrismaService } from '@core/database/prisma.service';
import { paymentReleasedEmail } from '@modules/notifications/templates';
import { ListUsersQuery } from './dto/list-users.query';
import { UpdateRoleDto } from './dto/update-role.dto';

const DEFAULT_PAGE_SIZE = 20;

export interface PaginatedUsers {
  items: UserDto[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  async getById(id: number): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    return toUserDto(user);
  }

  async notifyPaymentReleased(id: number): Promise<{ sent: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    const frontendUrl = this.config.get('frontendUrl', { infer: true });
    const email = paymentReleasedEmail({
      studentName: user.name ?? user.email,
      url: `${frontendUrl}/student/dashboard`,
    });
    await this.mail.send({ to: user.email, ...email });
    return { sent: true };
  }

  async list(query: ListUsersQuery): Promise<PaginatedUsers> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const where = query.role ? { role: query.role } : undefined;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: users.map((u) => toUserDto(u)), total, page, pageSize };
  }

  async updateRole(id: number, dto: UpdateRoleDto): Promise<UserDto> {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User not found.');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });
    return toUserDto(updated);
  }

  /** A user's enrollment history (cohorts joined), newest first — for the admin profile view. */
  async enrollments(userId: number): Promise<ProfileEnrollmentDto[]> {
    const exists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!exists) throw new NotFoundException('User not found.');

    const items = await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        cohort: { include: { _count: { select: { enrollments: true } } } },
      },
    });

    return items.map((e) => ({
      id: e.id,
      enrolledAt: e.enrolledAt.toISOString(),
      cohort: toCohortDto(e.cohort, e.cohort._count.enrollments),
    }));
  }
}
