import { apiClient } from "@lib/api-client";
import { USE_MOCK_DATA } from "@lib/config";
import { mockCohorts, mockEnrollments } from "@lib/mock-data";

import type { Cohort, Enrollment } from "./types";

const mockDelay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function listCohorts(): Promise<Cohort[]> {
  if (USE_MOCK_DATA) {
    await mockDelay(50);
    return [...mockCohorts];
  }
  return apiClient.get<Cohort[]>("/cohorts");
}

export async function listEnrollments(cohortId?: number): Promise<Enrollment[]> {
  if (USE_MOCK_DATA) {
    await mockDelay(50);
    if (cohortId == null) return [...mockEnrollments];
    return mockEnrollments.filter((e) => e.cohortId === cohortId);
  }
  const query = cohortId != null ? `?cohortId=${cohortId}` : "";
  return apiClient.get<Enrollment[]>(`/cohorts/enrollments${query}`);
}
