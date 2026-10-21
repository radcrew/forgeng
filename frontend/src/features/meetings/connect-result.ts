/**
 * The server sends the admin back to settings with `?googleCalendar=<result>`
 * after Google's page. These are the messages for each result.
 */
export const CONNECT_RESULT_PARAM = "googleCalendar";

export const CONNECT_RESULTS: Record<
  string,
  { ok: boolean; message: string }
> = {
  connected: { ok: true, message: "Google Calendar connected." },
  denied: {
    ok: false,
    message: "You cancelled on Google's page, so nothing was connected.",
  },
  state: {
    ok: false,
    message:
      "The connection took too long or was started in another browser. Please try again.",
  },
  scope: {
    ok: false,
    message:
      "Forgeng needs permission to manage your calendar events. Try again and leave that box ticked.",
  },
  token: {
    ok: false,
    message: "Google didn't finish the connection. Please try again.",
  },
  other_account: {
    ok: false,
    message:
      "Your upcoming meetings are in the calendar of the Google account you connected before. Connect that account, or cancel those meetings first.",
  },
  not_admin: {
    ok: false,
    message: "Only admins can connect Google Calendar.",
  },
  not_configured: {
    ok: false,
    message: "Google Calendar is not set up on this server.",
  },
};
