import { format } from "date-fns";

/**
 * Formats a date-only value such as a cohort start date. These are saved as
 * midnight UTC, so formatting them in the viewer's time zone would show the
 * day before anywhere west of UTC. This reads the calendar date as saved.
 */
export const formatCalendarDate = (
  value: string,
  pattern = "MMM d, yyyy",
): string => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return format(new Date(year, month - 1, day), pattern);
};

// A calendar day is saved as midnight UTC. It is over everywhere on Earth
// once it ends in the last time zone (UTC-12): 36 hours after that midnight.
const DAY_OVER_EVERYWHERE_MS = 36 * 60 * 60 * 1000;

/**
 * True once a saved calendar date (a cohort end date or a task due date) has
 * ended in every time zone, so nobody is cut off before their own day ends.
 */
export const isCalendarDayOver = (value: string, now = Date.now()): boolean =>
  now >= Date.parse(`${value.slice(0, 10)}T00:00:00Z`) + DAY_OVER_EVERYWHERE_MS;
