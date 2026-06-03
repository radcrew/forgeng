import { apiClient } from "@lib/api-client";

import type { Cohort } from "@types";
import type { UserProfile, UserRole } from "./types";

export interface UserEnrollment {
  id: number;
  enrolledAt: string;
  cohort: Cohort;
}

export const listUsers = async (role?: UserRole): Promise<UserProfile[]> => {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  return apiClient.get<UserProfile[]>(`/users${query}`);
};

export const listUserEnrollments = async (
  userId: number,
): Promise<UserEnrollment[]> =>
  apiClient.get<UserEnrollment[]>(`/users/${userId}/enrollments`);

export const updateUserRole = async (
  id: number,
  role: UserRole,
): Promise<UserProfile> => apiClient.patch<UserProfile>(`/users/${id}/role`, { role });
