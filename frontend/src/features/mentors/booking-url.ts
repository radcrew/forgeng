/**
 * Google Calendar booking pages, the same rule the server checks. Anything
 * else is refused, so a mentor's link can't send students to another site.
 */
export const BOOKING_URL_RE =
  /^https:\/\/(calendar\.google\.com|calendar\.app\.google)\/\S+$/;

export const BOOKING_URL_MESSAGE =
  "Use a Google Calendar booking page link. It starts with https://calendar.app.google/ or https://calendar.google.com/.";

export const isBookingUrl = (value: string): boolean =>
  BOOKING_URL_RE.test(value);
