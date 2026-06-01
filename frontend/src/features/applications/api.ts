import { apiClient } from "@lib/api-client";

import type { Application, ApplicationStatus } from "./types";

export interface CreateApplicationInput {
  background: string;
  motivation: string;
  experience?: string;
}

export interface UpdateApplicationStatusInput {
  status: ApplicationStatus;
  reviewerNote?: string | null;
  cohortId?: number | null;
}

export const listApplications = async (
  status?: ApplicationStatus,
): Promise<Application[]> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiClient.get<Application[]>(`/applications${query}`);
};

export const createApplication = async (
  input: CreateApplicationInput,
): Promise<Application> => apiClient.post<Application>("/applications", input);

/** The current user's own application, or null if they haven't applied yet. */
export const getMyApplication = async (): Promise<Application | null> =>
  apiClient.get<Application | null>("/applications/me");

export const updateApplicationStatus = async (
  id: number,
  input: UpdateApplicationStatusInput,
): Promise<Application> =>
  apiClient.patch<Application>(`/applications/${id}/status`, {
    status: input.status,
    ...(input.reviewerNote !== undefined && {
      reviewerNote: input.reviewerNote,
    }),
    ...(input.cohortId != null && { cohortId: input.cohortId }),
  });
