import { apiClient } from "@lib/api-client";

import type { Cohort, Enrollment } from "./types";

export const listCohorts = async (): Promise<Cohort[]> =>
  apiClient.get<Cohort[]>("/cohorts");

export const listEnrollments = async (cohortId: number): Promise<Enrollment[]> =>
  apiClient.get<Enrollment[]>(`/cohorts/${cohortId}/enrollments`);
