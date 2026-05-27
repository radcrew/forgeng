import { apiClient } from "@lib/api-client";

import type { Feedback, Submission, SubmissionStatus } from "./types";

export interface ListSubmissionsOptions {
  status?: SubmissionStatus;
  taskId?: number;
  cohortId?: number;
}

export async function listSubmissions(
  options: ListSubmissionsOptions = {},
): Promise<Submission[]> {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.taskId != null) params.set("taskId", String(options.taskId));
  if (options.cohortId != null) params.set("cohortId", String(options.cohortId));
  const query = params.size > 0 ? `?${params}` : "";
  return apiClient.get<Submission[]>(`/submissions${query}`);
}

export async function listFeedback(submissionId: number): Promise<Feedback[]> {
  return apiClient.get<Feedback[]>(`/submissions/${submissionId}/feedback`);
}
