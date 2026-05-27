"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { listFeedback, listSubmissions } from "@features/submissions/api";
import type { SubmissionStatus } from "@types";

export type SubmissionStatusFilter = SubmissionStatus | "all";

export interface UseSubmissionsOptions {
  status?: SubmissionStatusFilter;
  taskId?: number;
  cohortId?: number;
}

export const useSubmissions = (options: UseSubmissionsOptions = {}) => {
  const { status = "all", taskId, cohortId } = options;
  return useAsyncResource(
    () =>
      listSubmissions({
        taskId,
        cohortId,
        status: status === "all" ? undefined : status,
      }),
    [status, taskId, cohortId],
  );
};

export const useSubmissionFeedback = (submissionId: number | null) =>
  useAsyncResource(
    () =>
      submissionId == null
        ? Promise.resolve([])
        : listFeedback(submissionId),
    [submissionId],
  );
