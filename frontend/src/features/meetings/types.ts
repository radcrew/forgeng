export interface Meeting {
  id: number;
  title: string;
  note: string | null;
  /** ISO times, in UTC. */
  startsAt: string;
  endsAt: string;
  meetUrl: string | null;
  status: "scheduled" | "cancelled";
  host: { id: number; name: string | null };
  attendee: { id: number; name: string | null; email: string };
}

export interface MeetingFields {
  title: string;
  note: string | null;
  /** An ISO time, in UTC. */
  startsAt: string;
  durationMinutes: number;
}

export interface GoogleCalendarStatus {
  /** False when the server has no Google Calendar settings. */
  configured: boolean;
  connected: boolean;
  googleEmail: string | null;
  /** Google refused the saved access. The admin must connect again. */
  broken: boolean;
}
