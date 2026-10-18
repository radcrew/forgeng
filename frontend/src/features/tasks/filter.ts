import type { Task, TaskStatus } from "@types";

export type TaskListFilter = {
  /** A cohort id as text, or "all". */
  cohortId: string;
  status: TaskStatus | "all";
  search: string;
};

export const ALL_TASKS_FILTER: TaskListFilter = {
  cohortId: "all",
  status: "all",
  search: "",
};

/** The tasks that match the admin list filters. Search ignores case. */
export const filterTasks = (tasks: Task[], filter: TaskListFilter): Task[] => {
  const search = filter.search.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (filter.cohortId === "all" || String(task.cohortId) === filter.cohortId) &&
      (filter.status === "all" || task.status === filter.status) &&
      (!search || task.title.toLowerCase().includes(search)),
  );
};
