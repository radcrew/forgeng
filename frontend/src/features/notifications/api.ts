import { apiClient } from "@lib/api-client";

import type { Notification } from "./types";

export const listNotifications = async (
  unread?: boolean,
): Promise<Notification[]> => {
  const query = unread ? "?unread=true" : "";
  return apiClient.get<Notification[]>(`/notifications${query}`);
};

export const getUnreadCount = async (): Promise<number> => {
  const { count } = await apiClient.get<{ count: number }>(
    "/notifications/unread-count",
  );
  return count;
};

export const markNotificationRead = async (
  id: number,
): Promise<Notification> =>
  apiClient.patch<Notification>(`/notifications/${id}/read`, {});

export const markAllNotificationsRead = async (): Promise<number> => {
  const { count } = await apiClient.patch<{ count: number }>(
    "/notifications/read",
    {},
  );
  return count;
};
