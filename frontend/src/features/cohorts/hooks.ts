"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import * as cohortsApi from "./api";

export function useCohorts() {
  return useAsyncResource(() => cohortsApi.listCohorts(), []);
}

export function useEnrollments(cohortId: number | undefined) {
  return useAsyncResource(
    () => {
      if (cohortId == null) return Promise.resolve([]);
      return cohortsApi.listEnrollments(cohortId);
    },
    [cohortId],
  );
}
