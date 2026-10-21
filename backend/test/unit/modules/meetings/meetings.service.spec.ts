import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';
import {
  GoogleCalendarError,
  GoogleCalendarService,
} from '@modules/meetings/google-calendar.service';
import { MeetingsService } from '@modules/meetings/meetings.service';
import { NotificationsService } from '@modules/notifications/notifications.service';

const HOST = { id: 1, role: 'admin', name: 'Grace' } as User;
const OTHER_ADMIN = { id: 2, role: 'admin', name: 'Linus' } as User;
const STUDENT = { id: 7, role: 'student', name: 'Ada' } as User;

const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000);

const makeMeeting = (overrides: Record<string, unknown> = {}) => {
  const startsAt = inAnHour();
  return {
    id: 5,
    hostId: HOST.id,
    attendeeId: STUDENT.id,
    title: 'Mentoring call',
    note: null,
    startsAt,
    endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000),
    googleEventId: 'evt-1',
    meetUrl: 'https://meet.google.com/abc',
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
    host: { id: HOST.id, name: 'Grace', email: 'grace@example.com' },
    attendee: { id: STUDENT.id, name: 'Ada', email: 'ada@example.com' },
    ...overrides,
  };
};

describe('MeetingsService', () => {
  let prisma: {
    user: { findUnique: jest.Mock };
    meeting: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let calendar: {
    createEvent: jest.Mock;
    updateEvent: jest.Mock;
    deleteEvent: jest.Mock;
  };
  let notifications: { notifyMeeting: jest.Mock };
  let service: MeetingsService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: STUDENT.id,
          email: 'ada@example.com',
          role: 'student',
        }),
      },
      meeting: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(makeMeeting()),
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: object }) =>
            Promise.resolve(makeMeeting(data)),
          ),
        update: jest
          .fn()
          .mockImplementation(({ data }: { data: object }) =>
            Promise.resolve(makeMeeting(data)),
          ),
      },
    };
    calendar = {
      createEvent: jest.fn().mockResolvedValue({
        eventId: 'evt-1',
        meetUrl: 'https://meet.google.com/abc',
      }),
      updateEvent: jest.fn().mockResolvedValue(undefined),
      deleteEvent: jest.fn().mockResolvedValue(undefined),
    };
    notifications = { notifyMeeting: jest.fn().mockResolvedValue(undefined) };
    service = new MeetingsService(
      prisma as unknown as PrismaService,
      calendar as unknown as GoogleCalendarService,
      notifications as unknown as NotificationsService,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const schedule = (overrides: Record<string, unknown> = {}) =>
    service.schedule(HOST, {
      attendeeId: STUDENT.id,
      title: 'Mentoring call',
      note: 'Bring your CLI',
      startsAt: inAnHour(),
      durationMinutes: 30,
      ...overrides,
    });

  describe('schedule', () => {
    it('adds the event to Google, then saves the meeting with its Meet link', async () => {
      const dto = await schedule();

      const [hostId, input] = calendar.createEvent.mock.calls[0] as [
        number,
        { startsAt: Date; endsAt: Date; attendeeEmail: string },
      ];
      expect(hostId).toBe(HOST.id);
      expect(input.attendeeEmail).toBe('ada@example.com');
      expect(input.endsAt.getTime() - input.startsAt.getTime()).toBe(
        30 * 60 * 1000,
      );
      expect(prisma.meeting.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            googleEventId: 'evt-1',
            meetUrl: 'https://meet.google.com/abc',
          }) as unknown,
        }),
      );
      expect(dto.meetUrl).toBe('https://meet.google.com/abc');
    });

    it('tells the student in the app', async () => {
      await schedule();

      expect(notifications.notifyMeeting).toHaveBeenCalledWith({
        userId: STUDENT.id,
        type: 'meeting_scheduled',
        title: 'New meeting',
        body: 'Mentoring call with Grace',
      });
    });

    it.each([
      ['an applicant', { role: 'applicant' }],
      ['another admin', { role: 'admin' }],
    ])('refuses a meeting with %s', async (_, user) => {
      prisma.user.findUnique.mockResolvedValue({ id: 9, email: 'x', ...user });

      await expect(schedule()).rejects.toBeInstanceOf(NotFoundException);
      expect(calendar.createEvent).not.toHaveBeenCalled();
    });

    it('refuses a time in the past', async () => {
      await expect(
        schedule({ startsAt: new Date(Date.now() - 1000) }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(calendar.createEvent).not.toHaveBeenCalled();
    });

    it('takes the invite back when saving the meeting fails', async () => {
      prisma.meeting.create.mockRejectedValue(new Error('db down'));

      await expect(schedule()).rejects.toThrow('db down');
      expect(calendar.deleteEvent).toHaveBeenCalledWith(HOST.id, 'evt-1');
    });

    it('still schedules when the in-app notice fails', async () => {
      notifications.notifyMeeting.mockRejectedValue(new Error('db down'));

      await expect(schedule()).resolves.toMatchObject({ id: 5 });
    });

    it.each([
      ['not_configured', ServiceUnavailableException],
      ['not_connected', ConflictException],
      ['broken', ConflictException],
      ['failed', BadGatewayException],
    ] as const)(
      'answers a Google "%s" error with %p',
      async (reason, exception) => {
        calendar.createEvent.mockRejectedValue(
          new GoogleCalendarError(reason, 'message'),
        );

        await expect(schedule()).rejects.toBeInstanceOf(exception);
        expect(prisma.meeting.create).not.toHaveBeenCalled();
      },
    );
  });

  describe('reschedule', () => {
    it('moves the same Google event and keeps the length', async () => {
      const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

      await service.reschedule(HOST, 5, { startsAt });

      expect(calendar.updateEvent).toHaveBeenCalledWith(
        HOST.id,
        'evt-1',
        expect.objectContaining({
          startsAt,
          endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000),
          title: 'Mentoring call',
        }),
      );
      expect(notifications.notifyMeeting).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'meeting_changed' }),
      );
    });

    it('changes a meeting that has started when its start time is kept', async () => {
      const startsAt = new Date(Date.now() - 10 * 60 * 1000);
      prisma.meeting.findUnique.mockResolvedValue(
        makeMeeting({
          startsAt,
          endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
        }),
      );

      await service.reschedule(HOST, 5, {
        startsAt: new Date(startsAt),
        durationMinutes: 90,
      });

      expect(prisma.meeting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startsAt,
            endsAt: new Date(startsAt.getTime() + 90 * 60 * 1000),
          }) as unknown,
        }),
      );
    });

    it('refuses to move a meeting to a time in the past', async () => {
      await expect(
        service.reschedule(HOST, 5, {
          startsAt: new Date(Date.now() - 1000),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(calendar.updateEvent).not.toHaveBeenCalled();
    });

    it('removes the note when it is cleared', async () => {
      prisma.meeting.findUnique.mockResolvedValue(
        makeMeeting({ note: 'Old note' }),
      );

      await service.reschedule(HOST, 5, { note: null });

      expect(prisma.meeting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ note: null }) as unknown,
        }),
      );
    });

    it("treats another admin's meeting as not found", async () => {
      await expect(
        service.reschedule(OTHER_ADMIN, 5, { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(calendar.updateEvent).not.toHaveBeenCalled();
    });

    it('refuses a cancelled meeting', async () => {
      prisma.meeting.findUnique.mockResolvedValue(
        makeMeeting({ status: 'cancelled' }),
      );

      await expect(
        service.reschedule(HOST, 5, { title: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('keeps the saved meeting as it was when Google refuses', async () => {
      calendar.updateEvent.mockRejectedValue(
        new GoogleCalendarError('failed', 'message'),
      );

      await expect(
        service.reschedule(HOST, 5, { title: 'x' }),
      ).rejects.toBeInstanceOf(BadGatewayException);
      expect(prisma.meeting.update).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancels the Google event and marks the meeting cancelled', async () => {
      const dto = await service.cancel(HOST, 5);

      expect(calendar.deleteEvent).toHaveBeenCalledWith(HOST.id, 'evt-1');
      expect(dto.status).toBe('cancelled');
      expect(notifications.notifyMeeting).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'meeting_cancelled' }),
      );
    });

    it.each(['not_configured', 'not_connected', 'broken'] as const)(
      'still cancels the meeting when Google answers "%s"',
      async (reason) => {
        jest
          .spyOn(Logger.prototype, 'warn')
          .mockImplementation(() => undefined);
        calendar.deleteEvent.mockRejectedValue(
          new GoogleCalendarError(reason, 'message'),
        );

        const dto = await service.cancel(HOST, 5);

        expect(dto.status).toBe('cancelled');
        expect(notifications.notifyMeeting).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'meeting_cancelled' }),
        );
      },
    );

    it('keeps the meeting when Google fails for a moment', async () => {
      calendar.deleteEvent.mockRejectedValue(
        new GoogleCalendarError('failed', 'message'),
      );

      await expect(service.cancel(HOST, 5)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
      expect(prisma.meeting.update).not.toHaveBeenCalled();
    });

    it('does nothing more for a meeting already cancelled', async () => {
      prisma.meeting.findUnique.mockResolvedValue(
        makeMeeting({ status: 'cancelled' }),
      );

      await service.cancel(HOST, 5);

      expect(calendar.deleteEvent).not.toHaveBeenCalled();
      expect(prisma.meeting.update).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    const whereOf = () =>
      (
        prisma.meeting.findMany.mock.calls[0] as [
          { where: Record<string, unknown> },
        ]
      )[0].where;

    it('shows a student only their own upcoming meetings', async () => {
      // Even when they try to read another student's meetings.
      await service.list(STUDENT, { attendeeId: 99 });

      expect(whereOf()).toMatchObject({
        attendeeId: STUDENT.id,
        status: 'scheduled',
      });
    });

    it('shows an admin the meetings they host', async () => {
      await service.list(HOST, {});

      expect(whereOf()).toMatchObject({ hostId: HOST.id });
    });

    it("shows an admin every mentor's meetings with one student", async () => {
      await service.list(HOST, { attendeeId: STUDENT.id });

      expect(whereOf()).toMatchObject({ attendeeId: STUDENT.id });
      expect(whereOf()).not.toHaveProperty('hostId');
    });
  });
});
