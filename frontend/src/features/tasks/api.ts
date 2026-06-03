import { apiClient } from "@lib/api-client";

import type { Task, TaskStatus, TaskType } from "./types";

export interface TaskInput {
  cohortId: number;
  title: string;
  description?: string;
  type: TaskType;
  status?: TaskStatus;
  dueDate?: string;
}

export const listTasks = async (cohortId?: number): Promise<Task[]> => {
  const query = cohortId != null ? `?cohortId=${cohortId}` : "";
  return apiClient.get<Task[]>(`/tasks${query}`);
};

export const getTask = async (id: number): Promise<Task> =>
  apiClient.get<Task>(`/tasks/${id}`);

export const createTask = async (input: TaskInput): Promise<Task> =>
  apiClient.post<Task>("/tasks", input);

export const updateTask = async (
  id: number,
  input: Partial<TaskInput>,
): Promise<Task> => apiClient.patch<Task>(`/tasks/${id}`, input);

export const deleteTask = async (id: number): Promise<void> =>
  apiClient.delete<void>(`/tasks/${id}`);
