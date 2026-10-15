// A calendar day (a cohort end date or a task due date) is saved as midnight
// UTC. It is over everywhere on Earth once it ends in the last time zone
// (UTC-12): 36 hours after that midnight.
const DAY_OVER_EVERYWHERE_MS = 36 * 60 * 60 * 1000;

/**
 * True once a saved calendar date has ended in every time zone, so nobody
 * is cut off before their own day ends.
 */
export const isCalendarDayOver = (date: Date, now = Date.now()): boolean =>
  now >= date.getTime() + DAY_OVER_EVERYWHERE_MS;
