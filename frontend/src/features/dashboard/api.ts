import { apiClient } from "@lib/api-client";
import { USE_MOCK_DATA } from "@lib/config";
import {
  mockAdminDashboard,
  mockMentorDashboard,
  mockStudentDashboard,
} from "@lib/mock-data";

import type {
  AdminDashboard,
  MentorDashboard,
  StudentDashboard,
} from "./types";

const mockDelay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function getStudentDashboard(): Promise<StudentDashboard> {
  if (USE_MOCK_DATA) {
    await mockDelay(50);
    return mockStudentDashboard;
  }
  return apiClient.get<StudentDashboard>("/dashboard/student");
}

export async function getMentorDashboard(): Promise<MentorDashboard> {
  if (USE_MOCK_DATA) {
    await mockDelay(50);
    return mockMentorDashboard;
  }
  return apiClient.get<MentorDashboard>("/dashboard/mentor");
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  if (USE_MOCK_DATA) {
    await mockDelay(50);
    return mockAdminDashboard;
  }
  return apiClient.get<AdminDashboard>("/dashboard/admin");
}
