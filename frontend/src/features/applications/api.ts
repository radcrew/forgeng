import { apiClient } from "@lib/api-client";
import { USE_MOCK_DATA } from "@lib/config";
import { mockApplications } from "@lib/mock-data";

import type { Application, ApplicationStatus } from "./types";

const mockDelay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface UpdateApplicationStatusInput {
  status: ApplicationStatus;
  reviewerNote?: string | null;
  cohortId?: number | null;
}

export async function listApplications(
  status?: ApplicationStatus,
): Promise<Application[]> {
  if (USE_MOCK_DATA) {
    await mockDelay(50);
    if (!status) return [...mockApplications];
    return mockApplications.filter((a) => a.status === status);
  }

  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiClient.get<Application[]>(`/applications${query}`);
}

export async function updateApplicationStatus(
  id: number,
  input: UpdateApplicationStatusInput,
): Promise<Application> {
  if (USE_MOCK_DATA) {
    await mockDelay(400);
    const existing = mockApplications.find((a) => a.id === id);
    if (!existing) throw new Error("Application not found");
    return { ...existing, ...input };
  }

  return apiClient.patch<Application>(`/applications/${id}/status`, input);
}
