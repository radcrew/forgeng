"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import * as tasksApi from "./api";

export function useTasks(cohortId?: number) {
  return useAsyncResource(() => tasksApi.listTasks(cohortId), [cohortId]);
}
