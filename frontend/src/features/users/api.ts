import { apiClient } from "@lib/api-client";
import { USE_MOCK_DATA } from "@lib/config";
import { mockUsers } from "@lib/mock-data";

import type { UserProfile, UserRole } from "./types";

const mockDelay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function listUsers(role?: UserRole): Promise<UserProfile[]> {
  if (USE_MOCK_DATA) {
    await mockDelay(50);
    if (!role) return [...mockUsers];
    return mockUsers.filter((u) => u.role === role);
  }
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  return apiClient.get<UserProfile[]>(`/users${query}`);
}

export async function getUserById(id: number): Promise<UserProfile | null> {
  if (USE_MOCK_DATA) {
    await mockDelay(0);
    return mockUsers.find((u) => u.id === id) ?? null;
  }
  try {
    return await apiClient.get<UserProfile>(`/users/${id}`);
  } catch {
    return null;
  }
}
