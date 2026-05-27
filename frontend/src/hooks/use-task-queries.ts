"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { listTasks } from "@features/tasks/api";

export const useTasks = (cohortId?: number) =>
  useAsyncResource(() => listTasks(cohortId), [cohortId]);
