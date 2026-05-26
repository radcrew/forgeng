import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../common/auth/auth.types';
import { toFeedbackDto, type FeedbackDto } from '../common/serializers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async list(submissionId: number): Promise<FeedbackDto[]> {
    const items = await this.prisma.feedback.findMany({
      where: { submissionId },
      include: { mentor: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((f) => toFeedbackDto(f, f.mentor));
  }

  async create(
    submissionId: number,
    mentor: AuthUser,
    dto: CreateFeedbackDto,
  ): Promise<FeedbackDto> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException('Submission not found.');

    // Atomically write the feedback and reflect the verdict on the submission.
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
          mentorId: mentor.id,
          content: dto.content,
          verdict: dto.verdict,
        },
      }),
    ]);

    return toFeedbackDto(created, mentor);
  }
}
