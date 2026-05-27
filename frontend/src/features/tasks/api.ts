import { apiClient } from "@lib/api-client";

import type { Task } from "./types";

export const listTasks = async (cohortId?: number): Promise<Task[]> => {
  const query = cohortId != null ? `?cohortId=${cohortId}` : "";
  return apiClient.get<Task[]>(`/tasks${query}`);
};
