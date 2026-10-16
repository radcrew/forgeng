import type { Task, TaskStatus } from "@types";

/**
 * True when saving would move a published task that students already
 * submitted back to draft. Students only see published tasks, so their task
 * page would show "not found" until it is published again.
 */
export const unpublishHidesWork = (task: Task, nextStatus: TaskStatus) =>
  task.status === "published" &&
  nextStatus === "draft" &&
  task.submissionCount > 0;
