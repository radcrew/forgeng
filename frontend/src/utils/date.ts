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
