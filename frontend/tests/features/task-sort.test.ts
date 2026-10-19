import { describe, expect, it } from "vitest";

import { sortTasks } from "@features/tasks/sort";
import type { Task } from "@types";

function makeTask(id: number, dueDate: string | null): Task {
  return {
    id,
    cohortId: 3,
    title: `Task ${id}`,
    description: null,
    type: "coding",
    status: "draft",
    dueDate,
    submissionCount: 0,
    createdAt: "2026-01-15T10:30:00.000Z",
  } as Task;
}

// The server sends tasks newest first.
const tasks = [
  makeTask(1, "2026-03-01T00:00:00.000Z"),
  makeTask(2, null),
  makeTask(3, "2026-02-01T00:00:00.000Z"),
];

const ids = (list: Task[]) => list.map((t) => t.id);

describe("sortTasks", () => {
  it("keeps the newest-first order for 'recent'", () => {
    expect(ids(sortTasks(tasks, "recent"))).toEqual([1, 2, 3]);
  });

  it("puts the soonest due date first and tasks with no date last", () => {
    expect(ids(sortTasks(tasks, "due"))).toEqual([3, 1, 2]);
  });

  it("doesn't change the list it was given", () => {
    sortTasks(tasks, "due");
    expect(ids(tasks)).toEqual([1, 2, 3]);
  });
});
