import { API_BASE } from "@lib/config";
import { apiClient } from "@lib/api-client";
import type { GoogleCalendarStatus } from "./types";

/**
 * The page the admin opens to connect Google Calendar. It is a browser
 * redirect, not a fetch, because the server sends the browser on to Google.
 */
export const googleCalendarConnectUrl = (): string =>
  `${API_BASE}/integrations/google-calendar/connect`;

export const getGoogleCalendarStatus = (): Promise<GoogleCalendarStatus> =>
  apiClient.get<GoogleCalendarStatus>("/integrations/google-calendar");

/** Removes Forgeng's access at Google and forgets it. */
export const disconnectGoogleCalendar = (): Promise<void> =>
  apiClient.delete<void>("/integrations/google-calendar");
