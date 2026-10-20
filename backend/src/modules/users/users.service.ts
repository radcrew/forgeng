import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { AppConfiguration } from '../../config';
import {
  profileLinksOf,
  toCohortDto,
  walletsOf,
  toUserDto,
  type ProfileEnrollmentDto,
  type UserDto,
} from '../../common/mappers';
import { MailService } from '../../core/mail';
import { SlackChannelsService } from '../../core/slack';
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
  /** Every payment for this stipend month, oldest first. */
  payments: Array<{
    amount: string;
    currency: string;
    txLink: string | null;
    paidAt: string;
  }>;
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
  forMonth: string;
  paidAt: string;
}

/**
 * A month as "YYYY-MM", matching the keys of the monthly stats. Months are in
 * UTC everywhere: here, in the payment month migration, and in the stipend
 * check in the feedback service. So a payment near a month edge lands in the
 * same month whatever time zone the server runs in.
 */
const monthKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

/** The first moment (UTC) of the month `ago` months before `now`. */
const monthStartUtc = (now: Date, ago: number) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - ago, 1));

@Injectable()
export class UsersService {
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService<AppConfiguration, true>,
    private readonly slackChannels: SlackChannelsService,
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
    // Without an application, the links are kept on the user.
    return toUserDto(user, socials ?? profileLinksOf(user));
  }

  async recordPayment(id: number, dto: RecordPaymentDto): Promise<PaymentDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    // The payment chart only shows the last few months. A payment for any
    // other month would be saved but never shown, and could be paid twice.
    const now = new Date();
    const forMonth = dto.forMonth ?? monthKey(now);
    const oldest = monthKey(monthStartUtc(now, PAYMENT_HISTORY_MONTHS - 1));
    if (forMonth < oldest || forMonth > monthKey(now)) {
      throw new BadRequestException(
        `Pick a month from ${oldest} to ${monthKey(now)}.`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId: id,
        amount: dto.amount,
        currency: dto.currency,
        txLink: dto.txLink,
        note: dto.note,
        forMonth,
      },
    });

    const email = paymentReleasedEmail({
      studentName: user.name ?? user.email,
      url: this.absoluteUrl(STUDENT_ROUTES.DASHBOARD),
    });
    // The payment is already saved. A failed email must not report it as
    // failed, or the admin records it again and the student is paid twice.
    // It goes out after the response, so the save doesn't wait for it.
    this.mail.sendInBackground({ to: user.email, ...email });

    return {
      id: payment.id,
      amount: payment.amount.toString(),
      currency: payment.currency,
      txLink: payment.txLink,
      note: payment.note,
      forMonth: payment.forMonth,
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

    const roleChanged = dto.role !== exists.role;
    let leftCohortIds: number[] = [];
    const updated = await this.prisma.$transaction(async (tx) => {
      // The site always needs an admin: without one, nobody can manage it or
      // give the role back. Locking the admin rows makes a second role change
      // wait for this one, so two admins can't remove each other at the same
      // moment: each would otherwise still count the other as an admin.
      if (exists.role === 'admin' && dto.role !== 'admin') {
        const admins = await tx.$queryRaw<{ id: number }[]>`
          SELECT "id" FROM "users" WHERE "role" = 'admin' FOR UPDATE`;
        if (admins.length <= 1) {
          throw new BadRequestException(
            'This is the only admin. Make another user an admin first.',
          );
        }
      }

      const user = await tx.user.update({
        where: { id },
        data: { role: dto.role },
      });
      // A new role signs the user out everywhere: revoking their refresh
      // tokens means they sign in again and get a token with the new role.
      if (roleChanged) {
        await tx.refreshToken.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      // An applicant isn't in any cohort, so moving someone back to
      // applicant takes them out of their cohorts too. An accepted
      // application goes back to pending: kept as accepted, it told them to
      // open a student portal they can no longer enter. A rejected one stays.
      if (roleChanged && dto.role === 'applicant') {
        // Kept, so the user can be taken out of those Slack channels too.
        leftCohortIds = (
          await tx.enrollment.findMany({
            where: { userId: id },
            select: { cohortId: true },
          })
        ).map((e) => e.cohortId);
        await tx.enrollment.deleteMany({ where: { userId: id } });
        await tx.application.updateMany({
          where: { userId: id, status: 'accepted' },
          data: { status: 'pending' },
        });
      }
      // Making an applicant a student accepts their application if it was
      // still waiting. Decided applications stay as they are: decisions are
      // final. No email, since the admin chose this directly.
      if (exists.role === 'applicant' && dto.role === 'student') {
        await tx.application.updateMany({
          where: { userId: id, status: 'pending' },
          data: { status: 'accepted' },
        });
      }
      return user;
    });
    this.slackChannels.syncInBackground(id, leftCohortIds);
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
    const [application, enrollments, user] = await Promise.all([
      this.prisma.application.findUnique({
        where: { userId },
        select: { wallets: true },
      }),
      this.prisma.enrollment.findMany({
        where: { userId },
        select: { cohortId: true },
      }),
      // Holds the wallet when there is no application.
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { wallets: true },
      }),
    ]);

    const cohortIds = enrollments.map((e) => e.cohortId);
    const now = new Date();
    const monthlyStats: MonthlyPaymentStat[] = [];

    for (let i = PAYMENT_HISTORY_MONTHS - 1; i >= 0; i--) {
      const monthStart = monthStartUtc(now, i);
      const monthEnd = new Date(monthStartUtc(now, i - 1).getTime() - 1);
      const month = monthKey(monthStart);

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

      const [notification, payments] = await Promise.all([
        this.prisma.notification.findFirst({
          where: {
            type: 'payment_eligible',
            link: `/admin/users/${userId}`,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          orderBy: { createdAt: 'desc' },
        }),
        // By the stipend month, not the day paid, and all of them: a late
        // payment or a second one in a month used to show wrong or not at all.
        this.prisma.payment.findMany({
          where: { userId, forMonth: month },
          orderBy: { paidAt: 'asc' },
        }),
      ]);

      monthlyStats.push({
        month,
        tasksTotal: tasks.length,
        tasksApproved,
        eligible: tasks.length > 0 && tasksApproved === tasks.length,
        notifiedAt: notification?.createdAt.toISOString() ?? null,
        payments: payments.map((p) => ({
          amount: p.amount.toString(),
          currency: p.currency,
          txLink: p.txLink,
          paidAt: p.paidAt.toISOString(),
        })),
      });
    }

    return {
      wallets: walletsOf(application ? application.wallets : user?.wallets),
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
