import { apiClient } from "@lib/api-client";
import { USE_MOCK_DATA } from "@lib/config";
import { mockFeedback, mockSubmissions } from "@lib/mock-data";

import type { Feedback, Submission, SubmissionStatus } from "./types";

const mockDelay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface ListSubmissionsOptions {
  status?: SubmissionStatus;
  userId?: number;
}

export async function listSubmissions(
  options: ListSubmissionsOptions = {},
): Promise<Submission[]> {
  if (USE_MOCK_DATA) {
    await mockDelay(50);
    let result = [...mockSubmissions];
    if (options.status) {
      result = result.filter((s) => s.status === options.status);
    }
    if (options.userId != null) {
      result = result.filter((s) => s.user?.id === options.userId);
    }
    return result;
  }

  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.userId != null) params.set("userId", String(options.userId));
  const query = params.size > 0 ? `?${params}` : "";
  return apiClient.get<Submission[]>(`/submissions${query}`);
}

export async function listFeedback(submissionId: number): Promise<Feedback[]> {
  if (USE_MOCK_DATA) {
    await mockDelay(50);
    return mockFeedback.filter((f) => f.submissionId === submissionId);
  }
  return apiClient.get<Feedback[]>(`/submissions/${submissionId}/feedback`);
}
