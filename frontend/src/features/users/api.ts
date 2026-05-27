import { apiClient } from "@lib/api-client";

import type { UserProfile, UserRole } from "./types";

export const listUsers = async (role?: UserRole): Promise<UserProfile[]> => {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  return apiClient.get<UserProfile[]>(`/users${query}`);
};

export const updateUserRole = async (
  id: number,
  role: UserRole,
): Promise<UserProfile> => apiClient.patch<UserProfile>(`/users/${id}/role`, { role });
