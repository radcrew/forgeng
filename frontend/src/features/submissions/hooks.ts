"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import * as submissionsApi from "./api";
import type { SubmissionStatus } from "./types";

export type SubmissionStatusFilter = SubmissionStatus | "all";

export interface UseSubmissionsOptions {
  status?: SubmissionStatusFilter;
  taskId?: number;
  cohortId?: number;
}

export function useSubmissions(options: UseSubmissionsOptions = {}) {
  const { status = "all", taskId, cohortId } = options;
  return useAsyncResource(
    () =>
      submissionsApi.listSubmissions({
        taskId,
        cohortId,
        status: status === "all" ? undefined : status,
      }),
    [status, taskId, cohortId],
  );
}

export function useSubmissionFeedback(submissionId: number | null) {
  return useAsyncResource(
    () => {
      if (submissionId == null) return Promise.resolve([]);
      return submissionsApi.listFeedback(submissionId);
    },
    [submissionId],
  );
}
