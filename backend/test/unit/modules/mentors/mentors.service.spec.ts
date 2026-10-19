import { PrismaService } from '@core/database/prisma.service';
import { MentorsService } from '@modules/mentors/mentors.service';

describe('MentorsService', () => {
  let prisma: {
    user: { findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let service: MentorsService;

  beforeEach(() => {
    prisma = {
      user: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    service = new MentorsService(prisma as unknown as PrismaService);
  });

  describe('list', () => {
    it('lists only admins who added a booking page', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Grace',
          avatarUrl: null,
          bookingUrl: 'https://calendar.app.google/g',
        },
      ]);

      const mentors = await service.list();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'admin', bookingUrl: { not: null } },
        }),
      );
      expect(mentors).toEqual([
        {
          id: 1,
          name: 'Grace',
          avatarUrl: null,
          bookingUrl: 'https://calendar.app.google/g',
        },
      ]);
    });

    it('never shares an email or other private fields', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.list();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, name: true, avatarUrl: true, bookingUrl: true },
        }),
      );
    });
  });

  describe('booking url', () => {
    it('reads the admin own link', async () => {
      prisma.user.findUnique.mockResolvedValue({
        bookingUrl: 'https://calendar.app.google/g',
      });

      await expect(service.getBookingUrl(1)).resolves.toEqual({
        bookingUrl: 'https://calendar.app.google/g',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('saves the link on the admin own row', async () => {
      prisma.user.update.mockResolvedValue({ bookingUrl: null });

      await expect(service.updateBookingUrl(1, null)).resolves.toEqual({
        bookingUrl: null,
      });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { bookingUrl: null },
        }),
      );
    });
  });
});
