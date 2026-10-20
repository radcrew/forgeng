export interface GoogleCalendarStatus {
  /** False when the server has no Google Calendar settings. */
  configured: boolean;
  connected: boolean;
  googleEmail: string | null;
  /** Google refused the saved access. The admin must connect again. */
  broken: boolean;
}
