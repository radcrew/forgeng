import { apiClient } from "@lib/api-client";

import type {
  AdminDashboard,
  MentorDashboard,
  StudentDashboard,
} from "./types";

export const getStudentDashboard = async (): Promise<StudentDashboard> =>
  apiClient.get<StudentDashboard>("/dashboard/student");

export const getMentorDashboard = async (): Promise<MentorDashboard> =>
  apiClient.get<MentorDashboard>("/dashboard/mentor");

export const getAdminDashboard = async (): Promise<AdminDashboard> =>
  apiClient.get<AdminDashboard>("/dashboard/admin");
