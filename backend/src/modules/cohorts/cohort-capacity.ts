import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

/**
 * Throws unless the cohort has a free place. Takes a transaction client so
 * callers can check and enroll in the same transaction.
 */
export async function assertCohortHasRoom(
  db: Prisma.TransactionClient,
  cohortId: number,
): Promise<void> {
  const cohort = await db.cohort.findUnique({
    where: { id: cohortId },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!cohort) throw new NotFoundException('Cohort not found.');
  if (cohort._count.enrollments >= cohort.capacity) {
    throw new BadRequestException(
      `${cohort.name} is full: all ${cohort.capacity} places are taken. Raise the capacity to add more students.`,
    );
  }
}
