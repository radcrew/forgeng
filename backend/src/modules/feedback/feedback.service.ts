import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '@core/auth/auth.types';
import { toFeedbackDto, type FeedbackDto } from '@common/mappers';
import { PrismaService } from '@core/database/prisma.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(submissionId: number, user: AuthUser): Promise<FeedbackDto[]> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true },
    });
    if (!submission) throw new NotFoundException('Submission not found.');
    if (user.role === 'student' && submission.userId !== user.id) {
      throw new ForbiddenException(
        'Cannot view feedback on another student submission.',
      );
    }

    const items = await this.prisma.feedback.findMany({
      where: { submissionId },
      include: { reviewer: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((f) => toFeedbackDto(f, f.reviewer));
  }

  async create(
    submissionId: number,
    reviewer: AuthUser,
    dto: CreateFeedbackDto,
  ): Promise<FeedbackDto> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException('Submission not found.');

    const [, created] = await this.prisma.$transaction([
      this.prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: dto.verdict === 'approved' ? 'approved' : 'needs_work',
        },
      }),
      this.prisma.feedback.create({
        data: {
          submissionId,
          reviewerId: reviewer.id,
          content: dto.content,
          verdict: dto.verdict,
        },
      }),
    ]);

    await this.notifications.notifyFeedbackReceived({
      userId: submission.userId,
      submissionId,
      verdict: dto.verdict,
    });

    return toFeedbackDto(created, reviewer);
  }
}
