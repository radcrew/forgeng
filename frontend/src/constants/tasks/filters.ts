import type { LabeledValue } from "../shared/labeled-value";

/**
 * A task's progress from the student's point of view: their submission status,
 * or `todo` when they haven't submitted yet.
 */
export type TaskProgress = "todo" | "submitted" | "approved" | "needs_work";

export type TaskProgressFilter = TaskProgress | "all";

export type TaskSort = "due" | "recent";

export const TASK_PROGRESS_FILTER_TABS: LabeledValue<TaskProgressFilter>[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To Do" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "needs_work", label: "Needs Work" },
];

export const TASK_SORT_OPTIONS: LabeledValue<TaskSort>[] = [
  { value: "due", label: "Due date" },
  { value: "recent", label: "Recently added" },
];
