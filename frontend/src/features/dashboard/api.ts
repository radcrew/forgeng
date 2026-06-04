import { apiClient } from "@lib/api-client";

import type { AdminDashboard, StudentDashboard } from "./types";

export const getStudentDashboard = async (
  cohortId?: number,
): Promise<StudentDashboard> =>
  apiClient.get<StudentDashboard>(
    cohortId != null
      ? `/dashboard/student?cohortId=${cohortId}`
      : "/dashboard/student",
  );

export const getAdminDashboard = async (): Promise<AdminDashboard> =>
  apiClient.get<AdminDashboard>("/dashboard/admin");
