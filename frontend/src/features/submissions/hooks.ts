"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { listFeedback, listSubmissions } from "./api";
import type { SubmissionStatusFilter } from "@types";

export type { SubmissionStatusFilter };

export interface UseSubmissionsOptions {
  status?: SubmissionStatusFilter;
  taskId?: number;
  cohortId?: number;
  /** False waits before loading, for example until the cohort is known. */
  enabled?: boolean;
}

export const useSubmissions = (options: UseSubmissionsOptions = {}) => {
  const { status = "all", taskId, cohortId, enabled } = options;
  return useAsyncResource(
    () =>
      listSubmissions({
        taskId,
        cohortId,
        status: status === "all" ? undefined : status,
      }),
    [status, taskId, cohortId],
    { enabled },
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
