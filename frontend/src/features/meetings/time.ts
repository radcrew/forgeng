import { format } from "date-fns";

/**
 * The meeting form uses a date field and a time field in the admin's own
 * time zone. The server gets the moment in UTC, so every calendar shows it in
 * its own owner's time zone.
 */

/** "2026-11-02", the value a date field expects, in local time. */
export const toDateInput = (date: Date): string => format(date, "yyyy-MM-dd");

/** "15:00", the value a time field expects, in local time. */
export const toTimeInput = (date: Date): string => format(date, "HH:mm");

/** The moment for a local date and time, or null when either is missing. */
export const fromInputs = (date: string, time: string): Date | null => {
  if (!date || !time) return null;
  const moment = new Date(`${date}T${time}`);
  return Number.isNaN(moment.getTime()) ? null : moment;
};

/** The admin's time zone, for example "Europe/Berlin". */
export const localTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

/** "Mon, Nov 2 · 15:00 – 15:30", in local time. */
export const formatMeetingTime = (startsAt: string, endsAt: string): string =>
  `${format(new Date(startsAt), "EEE, MMM d · HH:mm")} – ${format(
    new Date(endsAt),
    "HH:mm",
  )}`;

/** The length in whole minutes. */
export const durationMinutes = (startsAt: string, endsAt: string): number =>
  Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
