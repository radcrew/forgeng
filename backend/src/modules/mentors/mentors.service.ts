import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma.service';

/** A mentor (an admin) that students can book a meeting with. */
export interface MentorDto {
  id: number;
  name: string | null;
  avatarUrl: string | null;
  bookingUrl: string;
}

export interface BookingUrlDto {
  bookingUrl: string | null;
}

@Injectable()
export class MentorsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admins who added a booking page. Admins without one are left out. */
  async list(): Promise<MentorDto[]> {
    const mentors = await this.prisma.user.findMany({
      where: { role: 'admin', bookingUrl: { not: null } },
      select: { id: true, name: true, avatarUrl: true, bookingUrl: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return mentors.map((m) => ({ ...m, bookingUrl: m.bookingUrl ?? '' }));
  }

  async getBookingUrl(userId: number): Promise<BookingUrlDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { bookingUrl: true },
    });
    return { bookingUrl: user?.bookingUrl ?? null };
  }

  async updateBookingUrl(
    userId: number,
    bookingUrl: string | null,
  ): Promise<BookingUrlDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { bookingUrl },
      select: { bookingUrl: true },
    });
    return { bookingUrl: user.bookingUrl };
  }
}
