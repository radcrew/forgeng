import { apiClient } from "@lib/api-client";

import type { Task } from "./types";

export const listTasks = async (cohortId?: number): Promise<Task[]> => {
  const query = cohortId != null ? `?cohortId=${cohortId}` : "";
  return apiClient.get<Task[]>(`/tasks${query}`);
};

export const getTask = async (id: number): Promise<Task> =>
  apiClient.get<Task>(`/tasks/${id}`);
