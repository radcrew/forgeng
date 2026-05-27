"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import * as submissionsApi from "./api";
import type { SubmissionStatus } from "./types";

export type SubmissionStatusFilter = SubmissionStatus | "all";

export interface UseSubmissionsOptions {
  status?: SubmissionStatusFilter;
  userId?: number;
}

export function useSubmissions(options: UseSubmissionsOptions = {}) {
  const { status = "all", userId } = options;
  return useAsyncResource(
    () =>
      submissionsApi.listSubmissions({
        userId,
        status: status === "all" ? undefined : status,
      }),
    [status, userId],
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
