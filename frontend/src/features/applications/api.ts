import { apiClient } from "@lib/api-client";

import type { Application, ApplicationStatus } from "./types";

export interface CreateApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  background: string;
  motivation: string;
  experience?: string;
}

export interface UpdateApplicationStatusInput {
  status: ApplicationStatus;
  reviewerNote?: string | null;
  cohortId?: number | null;
}

export async function listApplications(
  status?: ApplicationStatus,
): Promise<Application[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiClient.get<Application[]>(`/applications${query}`);
}

export async function createApplication(
  input: CreateApplicationInput,
): Promise<Application> {
  return apiClient.post<Application>("/applications", input);
}

export async function updateApplicationStatus(
  id: number,
  input: UpdateApplicationStatusInput,
): Promise<Application> {
  const body: Record<string, unknown> = { status: input.status };
  if (input.reviewerNote !== undefined) {
    body.reviewerNote = input.reviewerNote;
  }
  if (input.cohortId != null) {
    body.cohortId = input.cohortId;
  }
  return apiClient.patch<Application>(`/applications/${id}/status`, body);
}
