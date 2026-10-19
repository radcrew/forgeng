/** Google endpoints and limits shared by the connection and the calendar code. */

export const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
export const EVENTS_URL =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/** Create, change and delete events. Not read access to the whole calendar. */
export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

/** A Google call that takes longer than this is given up. */
export const GOOGLE_TIMEOUT_MS = 10_000;
