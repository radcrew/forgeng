import { apiClient } from "@lib/api-client";

import type { Feedback, Submission, SubmissionStatus } from "./types";

export interface ListSubmissionsOptions {
  status?: SubmissionStatus;
  taskId?: number;
  cohortId?: number;
}

export const listSubmissions = async (
  options: ListSubmissionsOptions = {},
): Promise<Submission[]> => {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.taskId != null) params.set("taskId", String(options.taskId));
  if (options.cohortId != null) params.set("cohortId", String(options.cohortId));
  const query = params.size > 0 ? `?${params}` : "";
  return apiClient.get<Submission[]>(`/submissions${query}`);
};

export const listFeedback = async (submissionId: number): Promise<Feedback[]> =>
  apiClient.get<Feedback[]>(`/submissions/${submissionId}/feedback`);

export interface SubmissionInput {
  content?: string;
  repoUrl?: string;
}

export const createSubmission = async (
  taskId: number,
  input: SubmissionInput,
): Promise<Submission> =>
  apiClient.post<Submission>("/submissions", { taskId, ...input });

/** Resubmit work against a `needs_work` submission, sending it back for review. */
export const resubmitSubmission = async (
  id: number,
  input: SubmissionInput,
): Promise<Submission> =>
  apiClient.patch<Submission>(`/submissions/${id}`, input);
