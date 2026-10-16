import type { TaskSort } from "@constants/tasks";
import type { Task } from "@types";

/**
 * Orders tasks for a list. "due" puts the soonest due date first, and tasks
 * with no due date go last. "recent" keeps the server's newest-first order.
 */
export const sortTasks = (tasks: Task[], sort: TaskSort): Task[] => {
  if (sort === "recent") return tasks;
  return [...tasks].sort((a, b) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aTime - bTime;
  });
};
