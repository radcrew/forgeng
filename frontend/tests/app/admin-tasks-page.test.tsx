import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Task } from "@types";

let tasks: Task[] = [];

vi.mock("@features/cohorts", () => ({
  useCohorts: () => ({ data: [{ id: 3, name: "Spring" }] }),
}));

vi.mock("@features/tasks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/tasks")>()),
  useTasks: () => ({ data: tasks, isLoading: false, refetch: vi.fn() }),
  TaskFormDialog: () => null,
}));

import Page from "../../src/app/admin/tasks/page";

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

describe("admin tasks page", () => {
  it("says there are no tasks yet when the list is empty", () => {
    tasks = [];
    render(<Page />);
    expect(
      screen.getByText("No tasks yet. Create your first task to get started."),
    ).toBeInTheDocument();
  });

  it("says nothing matches when the search hides every task", async () => {
    tasks = [makeTask()];
    render(<Page />);

    await userEvent.type(
      screen.getByRole("textbox", { name: "Search tasks by title" }),
      "quiz",
    );

    expect(
      screen.getByText("No tasks match these filters."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/No tasks yet/)).not.toBeInTheDocument();
  });
});
