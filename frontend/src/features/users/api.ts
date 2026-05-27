import { apiClient } from "@lib/api-client";

import type { UserProfile, UserRole } from "./types";

export async function listUsers(role?: UserRole): Promise<UserProfile[]> {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  return apiClient.get<UserProfile[]>(`/users${query}`);
}

export async function updateUserRole(
  id: number,
  role: UserRole,
): Promise<UserProfile> {
  return apiClient.patch<UserProfile>(`/users/${id}/role`, { role });
}
