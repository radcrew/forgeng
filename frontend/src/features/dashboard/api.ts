import { apiClient } from "@lib/api-client";

import type { AdminDashboard, StudentDashboard } from "./types";

export const getStudentDashboard = async (): Promise<StudentDashboard> =>
  apiClient.get<StudentDashboard>("/dashboard/student");

export const getAdminDashboard = async (): Promise<AdminDashboard> =>
  apiClient.get<AdminDashboard>("/dashboard/admin");
