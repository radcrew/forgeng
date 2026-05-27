import { apiClient } from "@lib/api-client";
import { USE_MOCK_DATA } from "@lib/config";
import { mockTasks } from "@lib/mock-data";

import type { Task } from "./types";

const mockDelay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function listTasks(cohortId?: number): Promise<Task[]> {
  if (USE_MOCK_DATA) {
    await mockDelay(50);
    if (cohortId == null) return [...mockTasks];
    return mockTasks.filter((t) => t.cohortId === cohortId);
  }
  const query = cohortId != null ? `?cohortId=${cohortId}` : "";
  return apiClient.get<Task[]>(`/tasks${query}`);
}
