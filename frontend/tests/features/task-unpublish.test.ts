import { describe, expect, it } from "vitest";

import { unpublishHidesWork } from "@features/tasks/unpublish";
import type { Task } from "@types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 5,
    cohortId: 3,
    title: "Build a CLI",
    description: null,
    type: "coding",
    status: "published",
    dueDate: null,
    submissionCount: 2,
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as Task;
}

describe("unpublishHidesWork", () => {
  it("warns when a published task with submissions goes back to draft", () => {
    expect(unpublishHidesWork(makeTask(), "draft")).toBe(true);
  });

  it("doesn't warn when the task stays published", () => {
    expect(unpublishHidesWork(makeTask(), "published")).toBe(false);
  });

  it("doesn't warn when nobody has submitted yet", () => {
    expect(
      unpublishHidesWork(makeTask({ submissionCount: 0 }), "draft"),
    ).toBe(false);
  });

  it("doesn't warn for a task that was already a draft", () => {
    expect(unpublishHidesWork(makeTask({ status: "draft" }), "draft")).toBe(
      false,
    );
  });
});
