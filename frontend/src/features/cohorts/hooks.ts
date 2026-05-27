"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import * as cohortsApi from "./api";

export function useCohorts() {
  return useAsyncResource(() => cohortsApi.listCohorts(), []);
}

export function useEnrollments(cohortId: number | undefined) {
  return useAsyncResource(
    () => cohortsApi.listEnrollments(cohortId),
    [cohortId],
  );
}
