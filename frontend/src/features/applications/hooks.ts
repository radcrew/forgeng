"use client";

import { useCallback, useState } from "react";

import { useAsyncResource } from "@hooks/use-async-resource";

import {
  listApplications,
  updateApplicationStatus,
  type UpdateApplicationStatusInput,
} from "./api";
import type { ApplicationStatusFilter } from "./components/application-status-tabs";

export const useApplications = (filter: ApplicationStatusFilter) =>
  useAsyncResource(
    () => listApplications(filter === "all" ? undefined : filter),
    [filter],
  );

export const useUpdateApplicationStatus = () => {
  const [isPending, setIsPending] = useState(false);

  const update = useCallback(
    async (id: number, input: UpdateApplicationStatusInput) => {
      setIsPending(true);
      try {
        return await updateApplicationStatus(id, input);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { update, isPending };
};
