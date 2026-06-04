import { apiClient } from "@lib/api-client";

import type { Cohort, CohortStatus, Enrollment } from "./types";

export interface CohortInput {
  name: string;
  description?: string;
  capacity: number;
  status?: CohortStatus;
  startDate?: string;
  endDate?: string;
}

export const listCohorts = async (): Promise<Cohort[]> =>
  apiClient.get<Cohort[]>("/cohorts");

export const getCohort = async (id: number): Promise<Cohort> =>
  apiClient.get<Cohort>(`/cohorts/${id}`);

export const createCohort = async (input: CohortInput): Promise<Cohort> =>
  apiClient.post<Cohort>("/cohorts", input);

export const updateCohort = async (
  id: number,
  input: Partial<CohortInput>,
): Promise<Cohort> => apiClient.patch<Cohort>(`/cohorts/${id}`, input);

export const deleteCohort = async (id: number): Promise<void> =>
  apiClient.delete<void>(`/cohorts/${id}`);

export const listEnrollments = async (cohortId: number): Promise<Enrollment[]> =>
  apiClient.get<Enrollment[]>(`/cohorts/${cohortId}/enrollments`);

export const enrollStudent = async (
  cohortId: number,
  userId: number,
): Promise<Enrollment> =>
  apiClient.post<Enrollment>(`/cohorts/${cohortId}/enroll`, { userId });
