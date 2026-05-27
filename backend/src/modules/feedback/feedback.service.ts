import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '@core/auth/auth.types';
import { toFeedbackDto, type FeedbackDto } from '@common/mappers';
import { PrismaService } from '@core/database/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async list(submissionId: number): Promise<FeedbackDto[]> {
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

    return toFeedbackDto(created, reviewer);
  }
}
