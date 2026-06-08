import { apiClient } from "@lib/api-client";

import type { Application, ApplicationStatus } from "./types";

export interface CreateApplicationInput {
  background: string;
  motivation: string;
  experience?: string;
  linkedin: string;
  twitter?: string;
  facebook?: string;
  github: string;
  portfolio?: string;
  telegram?: string;
  whatsapp?: string;
  country: string;
  videoUrl: string;
  wallets: Array<{ chain: string; address: string }>;
}

export const uploadVideoIntro = async (blob: Blob): Promise<{ url: string }> => {
  const form = new FormData();
  form.append("video", blob, "intro.webm");
  return apiClient.postForm<{ url: string }>("/applications/video-intro", form);
};

export interface UpdateApplicationStatusInput {
  status: ApplicationStatus;
  reviewerNote?: string | null;
  cohortId?: number | null;
}

export interface PaginatedApplications {
  items: Application[];
  total: number;
  page: number;
  pageSize: number;
}

export const listApplications = async (params?: {
  status?: ApplicationStatus;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedApplications> => {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.pageSize != null) search.set("pageSize", String(params.pageSize));
  const query = search.toString();
  return apiClient.get<PaginatedApplications>(`/applications${query ? `?${query}` : ""}`);
};

export const createApplication = async (
  input: CreateApplicationInput,
): Promise<Application> => apiClient.post<Application>("/applications", input);

/** The current user's own application, or null if they haven't applied yet. */
export const getMyApplication = async (): Promise<Application | null> =>
  apiClient.get<Application | null>("/applications/me");

export const getApplication = async (id: number): Promise<Application> =>
  apiClient.get<Application>(`/applications/${id}`);

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
