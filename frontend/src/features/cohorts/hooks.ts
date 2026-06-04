"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { getCohort, listCohorts, listEnrollments } from "./api";

export const useCohorts = () => useAsyncResource(() => listCohorts(), []);

export const useCohort = (cohortId: number) =>
  useAsyncResource(
    () =>
      Number.isFinite(cohortId)
        ? getCohort(cohortId)
        : Promise.reject(new Error("Invalid cohort id")),
    [cohortId],
  );

export const useEnrollments = (cohortId: number | undefined) =>
  useAsyncResource(
    () =>
      cohortId == null ? Promise.resolve([]) : listEnrollments(cohortId),
    [cohortId],
  );
