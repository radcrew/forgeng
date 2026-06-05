"use client";

import { useCallback, useState } from "react";

import { useAsyncResource } from "@hooks/use-async-resource";

import {
  listApplications,
  updateApplicationStatus,
  type UpdateApplicationStatusInput,
} from "./api";
import type { ApplicationStatusFilter } from "@types";

export const useApplications = (
  filter: ApplicationStatusFilter,
  page = 1,
  pageSize?: number,
) =>
  useAsyncResource(
    () =>
      listApplications({
        status: filter === "all" ? undefined : filter,
        page,
        pageSize,
      }),
    [filter, page, pageSize],
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
