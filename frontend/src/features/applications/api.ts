import { apiClient } from "@lib/api-client";

import type { Application, ApplicationStatus } from "./types";

export interface CreateApplicationInput {
  linkedin?: string;
  twitter?: string;
  github?: string;
  portfolio?: string;
  telegram?: string;
  whatsapp?: string;
  country: string;
  videoUrl: string;
  wallets: Array<{ chain: string; address: string }>;
}

interface VideoUploadTarget {
  uploadUrl: string | null;
  path: string | null;
}

// The browser uploads straight to storage through a signed URL, because the
// API host rejects request bodies this large. Local dev without storage gets
// no URL and posts the file to the API instead.
export const uploadVideoIntro = async (blob: Blob): Promise<{ url: string }> => {
  const contentType = blob.type.startsWith("video/mp4") ? "video/mp4" : "video/webm";
  const { uploadUrl, path } = await apiClient.post<VideoUploadTarget>(
    "/applications/video-intro/upload-url",
    { contentType },
  );

  if (!uploadUrl || !path) {
    const form = new FormData();
    form.append("video", blob, "intro.webm");
    return apiClient.postForm<{ url: string }>("/applications/video-intro", form);
  }

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!res.ok) throw new Error(`Video upload failed (${res.status})`);
  return { url: path };
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
