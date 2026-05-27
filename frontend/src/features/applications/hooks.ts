"use client";

import { useCallback, useState } from "react";

import { useAsyncResource } from "@hooks/use-async-resource";

import * as applicationsApi from "./api";
import type { ApplicationStatusFilter } from "./components/application-status-tabs";

export function useApplications(filter: ApplicationStatusFilter) {
  return useAsyncResource(
    () =>
      applicationsApi.listApplications(
        filter === "all" ? undefined : filter,
      ),
    [filter],
  );
}

export function useUpdateApplicationStatus() {
  const [isPending, setIsPending] = useState(false);

  const update = useCallback(
    async (id: number, input: applicationsApi.UpdateApplicationStatusInput) => {
      setIsPending(true);
      try {
        return await applicationsApi.updateApplicationStatus(id, input);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { update, isPending };
}
