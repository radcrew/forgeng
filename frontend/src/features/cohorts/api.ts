import { apiClient } from "@lib/api-client";

import type { Cohort, Enrollment } from "./types";

export async function listCohorts(): Promise<Cohort[]> {
  return apiClient.get<Cohort[]>("/cohorts");
}

export async function listEnrollments(cohortId: number): Promise<Enrollment[]> {
  return apiClient.get<Enrollment[]>(`/cohorts/${cohortId}/enrollments`);
}
