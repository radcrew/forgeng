import { apiClient } from "@lib/api-client";

import type {
  AdminDashboard,
  MentorDashboard,
  StudentDashboard,
} from "./types";

export async function getStudentDashboard(): Promise<StudentDashboard> {
  return apiClient.get<StudentDashboard>("/dashboard/student");
}

export async function getMentorDashboard(): Promise<MentorDashboard> {
  return apiClient.get<MentorDashboard>("/dashboard/mentor");
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  return apiClient.get<AdminDashboard>("/dashboard/admin");
}
