import { describe, expect, it } from "vitest";

import { ALL_TASKS_FILTER, filterTasks } from "@features/tasks/filter";
import type { Task } from "@types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    cohortId: 3,
    title: "Build a CLI",
    description: null,
    type: "coding",
    status: "draft",
    dueDate: null,
    submissionCount: 0,
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as Task;
}

const tasks = [
  makeTask({ id: 1, cohortId: 3, title: "Build a CLI", status: "draft" }),
  makeTask({ id: 2, cohortId: 3, title: "Read the docs", status: "published" }),
  makeTask({ id: 3, cohortId: 7, title: "Build an API", status: "published" }),
];

const ids = (list: Task[]) => list.map((t) => t.id);

describe("filterTasks", () => {
  it("keeps every task with no filters", () => {
    expect(ids(filterTasks(tasks, ALL_TASKS_FILTER))).toEqual([1, 2, 3]);
  });

  it("keeps only the chosen cohort", () => {
    expect(
      ids(filterTasks(tasks, { ...ALL_TASKS_FILTER, cohortId: "7" })),
    ).toEqual([3]);
  });

  it("keeps only the chosen status", () => {
    expect(
      ids(filterTasks(tasks, { ...ALL_TASKS_FILTER, status: "published" })),
    ).toEqual([2, 3]);
  });

  it("searches titles without caring about case or outer spaces", () => {
    expect(
      ids(filterTasks(tasks, { ...ALL_TASKS_FILTER, search: "  build " })),
    ).toEqual([1, 3]);
  });

  it("combines all filters", () => {
    expect(
      ids(
        filterTasks(tasks, {
          cohortId: "3",
          status: "draft",
          search: "build",
        }),
      ),
    ).toEqual([1]);
  });
});
