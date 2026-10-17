import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { AppConfiguration } from '../../config';
import {
  toCohortDto,
  toUserDto,
  type ProfileEnrollmentDto,
  type UserDto,
} from '../../common/mappers';
import { MailService } from '../../core/mail';
import { PrismaService } from '../../core/database/prisma.service';
import {
  paymentReleasedEmail,
  walletMissingEmail,
} from '../notifications/templates';
import { DEFAULT_PAGE_SIZE } from '../../common/constants/pagination';
import { paginationParams } from '../../common/utils/pagination';
import { STUDENT_ROUTES } from '../../common/constants/routes';
import { ListUsersQuery } from './dto/list-users.query';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

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
  private readonly logger = new Logger(UsersService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {
    this.frontendUrl = this.config.get('frontendUrl', { infer: true });
  }

  private absoluteUrl(path: string): string {
    return `${this.frontendUrl}${path}`;
  }

  async getById(id: number): Promise<UserDto> {
    const [user, socials] = await Promise.all([
      this.prisma.user.findUnique({ where: { id } }),
      this.prisma.application.findUnique({
        where: { userId: id },
        select: {
          linkedin: true,
          twitter: true,
          facebook: true,
          github: true,
          portfolio: true,
          telegram: true,
          whatsapp: true,
        },
      }),
    ]);
    if (!user) throw new NotFoundException('User not found.');
    return toUserDto(user, socials);
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

    const email = paymentReleasedEmail({
      studentName: user.name ?? user.email,
      url: this.absoluteUrl(STUDENT_ROUTES.DASHBOARD),
    });
    // The payment is already saved. A failed email must not report it as
    // failed, or the admin records it again and the student is paid twice.
    try {
      await this.mail.send({ to: user.email, ...email });
    } catch (err) {
      this.logger.error(
        `Failed to send payment email to ${user.email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }

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
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginationParams(page, pageSize),
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: users.map((u) => toUserDto(u)), total, page, pageSize };
  }

  async updateRole(id: number, dto: UpdateRoleDto): Promise<UserDto> {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User not found.');

    // The site always needs an admin: without one, nobody can manage it or
    // give the role back.
    if (exists.role === 'admin' && dto.role !== 'admin') {
      const admins = await this.prisma.user.count({ where: { role: 'admin' } });
      if (admins <= 1) {
        throw new BadRequestException(
          'This is the only admin. Make another user an admin first.',
        );
      }
    }

    // A new role signs the user out everywhere: revoking their refresh tokens
    // means they sign in again and get a token with the new role.
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { role: dto.role },
      }),
      ...(dto.role === exists.role
        ? []
        : [
            this.prisma.refreshToken.updateMany({
              where: { userId: id, revokedAt: null },
              data: { revokedAt: new Date() },
            }),
          ]),
    ]);
    return toUserDto(updated);
  }

  async notifyWalletMissing(id: number): Promise<{ sent: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    const email = walletMissingEmail({
      studentName: user.name ?? user.email,
      url: this.absoluteUrl(STUDENT_ROUTES.PROFILE),
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
      // Count tasks, not submissions, so duplicates aren't counted twice.
      const tasksApproved =
        taskIds.length > 0
          ? (
              await this.prisma.submission.findMany({
                where: { userId, taskId: { in: taskIds }, status: 'approved' },
                select: { taskId: true },
                distinct: ['taskId'],
              })
            ).length
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
