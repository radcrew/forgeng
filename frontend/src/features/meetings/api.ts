import { API_BASE } from "@lib/config";
import { apiClient } from "@lib/api-client";
import type { GoogleCalendarStatus, Meeting, MeetingFields } from "./types";

/**
 * Upcoming meetings. With `attendeeId`, every mentor's meetings with that
 * student (admins only).
 */
export const listMeetings = (attendeeId?: number): Promise<Meeting[]> =>
  apiClient.get<Meeting[]>(
    attendeeId ? `/meetings?attendeeId=${attendeeId}` : "/meetings",
  );

export const scheduleMeeting = (
  payload: MeetingFields & { attendeeId: number },
): Promise<Meeting> => apiClient.post<Meeting>("/meetings", payload);

export const rescheduleMeeting = (
  id: number,
  payload: MeetingFields,
): Promise<Meeting> => apiClient.patch<Meeting>(`/meetings/${id}`, payload);

export const cancelMeeting = (id: number): Promise<Meeting> =>
  apiClient.delete<Meeting>(`/meetings/${id}`);

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
