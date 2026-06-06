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
import {
  paymentReleasedEmail,
  walletMissingEmail,
} from '@modules/notifications/templates';
import { ListUsersQuery } from './dto/list-users.query';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const DEFAULT_PAGE_SIZE = 20;
const PAYMENT_HISTORY_MONTHS = 6;

export interface PaginatedUsers {
  items: UserDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MonthlyPaymentStat {
  month: string; // "2026-01"
  tasksTotal: number;
  tasksApproved: number;
  eligible: boolean;
  notifiedAt: string | null;
  payment: {
    amount: string;
    currency: string;
    txLink: string | null;
    paidAt: string;
  } | null;
}

export interface UserPaymentStats {
  wallets: Array<{ chain: string; address: string }>;
  monthlyStats: MonthlyPaymentStat[];
}

export interface PaymentDto {
  id: number;
  amount: string;
  currency: string;
  txLink: string | null;
  note: string | null;
  paidAt: string;
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

  async recordPayment(id: number, dto: RecordPaymentDto): Promise<PaymentDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    const payment = await this.prisma.payment.create({
      data: {
        userId: id,
        amount: dto.amount,
        currency: dto.currency,
        txLink: dto.txLink,
        note: dto.note,
      },
    });

    const frontendUrl = this.config.get('frontendUrl', { infer: true });
    const email = paymentReleasedEmail({
      studentName: user.name ?? user.email,
      url: `${frontendUrl}/student/dashboard`,
    });
    await this.mail.send({ to: user.email, ...email });

    return {
      id: payment.id,
      amount: payment.amount.toString(),
      currency: payment.currency,
      txLink: payment.txLink,
      note: payment.note,
      paidAt: payment.paidAt.toISOString(),
    };
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

  async notifyWalletMissing(id: number): Promise<{ sent: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    const frontendUrl = this.config.get('frontendUrl', { infer: true });
    const email = walletMissingEmail({
      studentName: user.name ?? user.email,
      url: `${frontendUrl}/student/profile`,
    });
    await this.mail.send({ to: user.email, ...email });
    return { sent: true };
  }

  async paymentStats(userId: number): Promise<UserPaymentStats> {
    const [application, enrollments] = await Promise.all([
      this.prisma.application.findUnique({
        where: { userId },
        select: { wallets: true },
      }),
      this.prisma.enrollment.findMany({
        where: { userId },
        select: { cohortId: true },
      }),
    ]);

    const cohortIds = enrollments.map((e) => e.cohortId);
    const now = new Date();
    const monthlyStats: MonthlyPaymentStat[] = [];

    for (let i = PAYMENT_HISTORY_MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const tasks =
        cohortIds.length > 0
          ? await this.prisma.task.findMany({
              where: {
                cohortId: { in: cohortIds },
                status: 'published',
                dueDate: { gte: monthStart, lte: monthEnd },
              },
              select: { id: true },
            })
          : [];

      const taskIds = tasks.map((t) => t.id);
      const tasksApproved =
        taskIds.length > 0
          ? await this.prisma.submission.count({
              where: { userId, taskId: { in: taskIds }, status: 'approved' },
            })
          : 0;

      const [notification, payment] = await Promise.all([
        this.prisma.notification.findFirst({
          where: {
            type: 'payment_eligible',
            link: `/admin/users/${userId}`,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.payment.findFirst({
          where: {
            userId,
            paidAt: { gte: monthStart, lte: monthEnd },
          },
          orderBy: { paidAt: 'desc' },
        }),
      ]);

      monthlyStats.push({
        month,
        tasksTotal: tasks.length,
        tasksApproved,
        eligible: tasks.length > 0 && tasksApproved === tasks.length,
        notifiedAt: notification?.createdAt.toISOString() ?? null,
        payment: payment
          ? {
              amount: payment.amount.toString(),
              currency: payment.currency,
              txLink: payment.txLink,
              paidAt: payment.paidAt.toISOString(),
            }
          : null,
      });
    }

    return {
      wallets:
        (application?.wallets as Array<{
          chain: string;
          address: string;
        }> | null) ?? [],
      monthlyStats,
    };
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
