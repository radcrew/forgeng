"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { listCohorts, listEnrollments } from "@features/cohorts/api";

export const useCohorts = () => useAsyncResource(() => listCohorts(), []);

export const useEnrollments = (cohortId: number | undefined) =>
  useAsyncResource(
    () =>
      cohortId == null ? Promise.resolve([]) : listEnrollments(cohortId),
    [cohortId],
  );
