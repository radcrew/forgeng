"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { listTasks } from "./api";

export const useTasks = (cohortId?: number) =>
  useAsyncResource(() => listTasks(cohortId), [cohortId]);
