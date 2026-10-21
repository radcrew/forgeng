import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Meeting, User } from '@prisma/client';

import type { AuthUser } from '../../core/auth/auth.types';
import { PrismaService } from '../../core/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  ListMeetingsQuery,
  RescheduleMeetingDto,
  ScheduleMeetingDto,
} from './dto/meeting.dto';
import {
  GoogleCalendarError,
  GoogleCalendarService,
} from './google-calendar.service';

type Person = Pick<User, 'id' | 'name' | 'email'>;

export interface MeetingDto {
  id: number;
  title: string;
  note: string | null;
  startsAt: string;
  endsAt: string;
  meetUrl: string | null;
  status: Meeting['status'];
  host: { id: number; name: string | null };
  attendee: { id: number; name: string | null; email: string };
}

const PEOPLE = {
  host: { select: { id: true, name: true, email: true } },
  attendee: { select: { id: true, name: true, email: true } },
} as const;

type MeetingWithPeople = Meeting & { host: Person; attendee: Person };

const MINUTE_MS = 60 * 1000;

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendar: GoogleCalendarService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Upcoming meetings. A student sees their own. An admin sees the ones they
   * host, or, with `attendeeId`, every mentor's meetings with that student.
   */
  async list(user: AuthUser, query: ListMeetingsQuery): Promise<MeetingDto[]> {
    const where =
      user.role !== 'admin'
        ? { attendeeId: user.id }
        : query.attendeeId
          ? { attendeeId: query.attendeeId }
          : { hostId: user.id };
    const meetings = await this.prisma.meeting.findMany({
      where: { ...where, status: 'scheduled', endsAt: { gte: new Date() } },
      include: PEOPLE,
      orderBy: { startsAt: 'asc' },
    });
    return meetings.map(toMeetingDto);
  }

  /**
   * Adds the meeting to the admin's Google Calendar, which emails the
   * student an invite with a Meet link, then saves it here.
   */
  async schedule(host: AuthUser, dto: ScheduleMeetingDto): Promise<MeetingDto> {
    const attendee = await this.prisma.user.findUnique({
      where: { id: dto.attendeeId },
      select: { id: true, email: true, role: true },
    });
    // Students only for now. Applicants need an interview step first.
    if (attendee?.role !== 'student') {
      throw new NotFoundException('Student not found.');
    }
    const startsAt = assertFuture(dto.startsAt);
    const endsAt = new Date(
      startsAt.getTime() + dto.durationMinutes * MINUTE_MS,
    );
    const note = dto.note ?? null;

    const event = await this.google(() =>
      this.calendar.createEvent(host.id, {
        title: dto.title,
        note,
        startsAt,
        endsAt,
        attendeeEmail: attendee.email,
      }),
    );

    let meeting: MeetingWithPeople;
    try {
      meeting = await this.prisma.meeting.create({
        data: {
          hostId: host.id,
          attendeeId: attendee.id,
          title: dto.title,
          note,
          startsAt,
          endsAt,
          googleEventId: event.eventId,
          meetUrl: event.meetUrl,
        },
        include: PEOPLE,
      });
    } catch (err) {
      // Without a saved meeting, nobody could move or cancel the invite the
      // student already got. So take it back.
      await this.calendar
        .deleteEvent(host.id, event.eventId)
        .catch((deleteErr: unknown) =>
          this.logger.error(
            `Failed to cancel Google event ${event.eventId} after a failed save`,
            deleteErr instanceof Error ? deleteErr.stack : String(deleteErr),
          ),
        );
      throw err;
    }

    await this.notify(meeting, 'meeting_scheduled', 'New meeting');
    return toMeetingDto(meeting);
  }

  /** Moves, renames or changes the note of a meeting the admin hosts. */
  async reschedule(
    host: AuthUser,
    id: number,
    dto: RescheduleMeetingDto,
  ): Promise<MeetingDto> {
    const meeting = await this.findHosted(host, id);
    if (meeting.status === 'cancelled') {
      throw new ConflictException('This meeting was cancelled.');
    }

    // Only a new start time must be in the future. So a meeting that has
    // started can still be made longer, or get a new note.
    const startsAt =
      dto.startsAt && dto.startsAt.getTime() !== meeting.startsAt.getTime()
        ? assertFuture(dto.startsAt)
        : meeting.startsAt;
    const durationMs =
      dto.durationMinutes !== undefined
        ? dto.durationMinutes * MINUTE_MS
        : meeting.endsAt.getTime() - meeting.startsAt.getTime();
    const fields = {
      title: dto.title ?? meeting.title,
      // Left out keeps the note, null removes it.
      note: dto.note === undefined ? meeting.note : dto.note,
      startsAt,
      endsAt: new Date(startsAt.getTime() + durationMs),
    };

    if (meeting.googleEventId) {
      const eventId = meeting.googleEventId;
      await this.google(() =>
        this.calendar.updateEvent(host.id, eventId, fields),
      );
    }
    const updated = await this.prisma.meeting.update({
      where: { id },
      data: fields,
      include: PEOPLE,
    });
    await this.notify(updated, 'meeting_changed', 'Meeting changed');
    return toMeetingDto(updated);
  }

  /** Cancels a meeting the admin hosts. Google emails the student. */
  async cancel(host: AuthUser, id: number): Promise<MeetingDto> {
    const meeting = await this.findHosted(host, id);
    // Pressing cancel twice is fine.
    if (meeting.status === 'cancelled') return toMeetingDto(meeting);

    if (meeting.googleEventId) {
      await this.deleteEventIfConnected(host.id, meeting.googleEventId);
    }
    const cancelled = await this.prisma.meeting.update({
      where: { id },
      data: { status: 'cancelled' },
      include: PEOPLE,
    });
    await this.notify(cancelled, 'meeting_cancelled', 'Meeting cancelled');
    return toMeetingDto(cancelled);
  }

  /**
   * Cancels the Google event. Without a working connection, for example
   * after the admin disconnected, Forgeng can't reach the event. The meeting
   * is then cancelled only here, so the student doesn't keep a meeting that
   * won't happen. Forgeng still tells them in the app. When Google fails
   * for a moment, the admin gets the error and can try again.
   */
  private async deleteEventIfConnected(
    hostId: number,
    eventId: string,
  ): Promise<void> {
    await this.google(async () => {
      try {
        await this.calendar.deleteEvent(hostId, eventId);
      } catch (err) {
        if (!(err instanceof GoogleCalendarError) || err.reason === 'failed') {
          throw err;
        }
        this.logger.warn(
          `Cancelled meeting event ${eventId} only in Forgeng, because user ${hostId} has no working Google Calendar connection`,
        );
      }
    });
  }

  /**
   * A meeting this admin hosts. Another admin's meeting reads as not found:
   * it lives in that admin's calendar, so only they can change it.
   */
  private async findHosted(
    host: AuthUser,
    id: number,
  ): Promise<MeetingWithPeople> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: PEOPLE,
    });
    if (!meeting || meeting.hostId !== host.id) {
      throw new NotFoundException('Meeting not found.');
    }
    return meeting;
  }

  /** Best-effort: the meeting is saved, and Google already emailed. */
  private async notify(
    meeting: MeetingWithPeople,
    type: 'meeting_scheduled' | 'meeting_changed' | 'meeting_cancelled',
    title: string,
  ): Promise<void> {
    const mentor = meeting.host.name ?? 'Your mentor';
    try {
      await this.notifications.notifyMeeting({
        userId: meeting.attendeeId,
        type,
        title,
        body: `${meeting.title} with ${mentor}`,
      });
    } catch (err) {
      this.logger.error(
        `Failed to notify user ${meeting.attendeeId} about meeting ${meeting.id}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /** Turns a Google Calendar failure into an answer the admin can act on. */
  private async google<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (err) {
      if (!(err instanceof GoogleCalendarError)) throw err;
      switch (err.reason) {
        case 'not_configured':
          throw new ServiceUnavailableException(err.message);
        case 'not_connected':
        case 'broken':
          throw new ConflictException(err.message);
        case 'failed':
          throw new BadGatewayException(err.message);
      }
    }
  }
}

function assertFuture(startsAt: Date): Date {
  if (startsAt.getTime() <= Date.now()) {
    throw new BadRequestException('Pick a time in the future.');
  }
  return startsAt;
}

function toMeetingDto(meeting: MeetingWithPeople): MeetingDto {
  return {
    id: meeting.id,
    title: meeting.title,
    note: meeting.note,
    startsAt: meeting.startsAt.toISOString(),
    endsAt: meeting.endsAt.toISOString(),
    meetUrl: meeting.meetUrl,
    status: meeting.status,
    host: { id: meeting.host.id, name: meeting.host.name },
    attendee: {
      id: meeting.attendee.id,
      name: meeting.attendee.name,
      email: meeting.attendee.email,
    },
  };
}
