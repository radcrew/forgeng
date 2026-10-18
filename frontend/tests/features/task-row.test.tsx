import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteTask = vi.fn();
vi.mock("@features/tasks/api", () => ({
  deleteTask: (...args: unknown[]) => deleteTask(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import type { Task } from "@types";
import { TaskRow as Row } from "@features/tasks/components/row";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 5,
    cohortId: 3,
    title: "Build a CLI",
    description: "A command line tool",
    type: "project",
    status: "published",
    dueDate: "2026-02-01T00:00:00.000Z",
    submissionCount: 2,
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as Task;
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteTask.mockResolvedValue(undefined);
});


describe("task Row", () => {
  it("renders the title, type, status, and submission count", () => {
    render(<Row task={makeTask()} onEdit={vi.fn()} />);
    expect(screen.getByText("Build a CLI")).toBeInTheDocument();
    expect(screen.getByText("published")).toBeInTheDocument();
    expect(screen.getByText("2 submissions")).toBeInTheDocument();
  });

  it("shows the cohort the task belongs to", () => {
    render(<Row task={makeTask()} cohortName="Spring 2026" onEdit={vi.fn()} />);
    expect(screen.getByText("Spring 2026")).toBeInTheDocument();
  });

  it("says submission, not submissions, when there is only one", () => {
    render(<Row task={makeTask({ submissionCount: 1 })} onEdit={vi.fn()} />);
    expect(screen.getByText("1 submission")).toBeInTheDocument();
  });

  it("shows the due date as saved, in any time zone", () => {
    render(<Row task={makeTask()} onEdit={vi.fn()} />);
    expect(screen.getByText("Due Feb 1, 2026")).toBeInTheDocument();
  });

  it("calls onEdit from the edit button", async () => {
    const onEdit = vi.fn();
    render(<Row task={makeTask()} onEdit={onEdit} />);

    await userEvent.click(screen.getByRole("button", { name: "Edit task" }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }));
  });

  it("asks before deleting and says the submissions go too", async () => {
    render(<Row task={makeTask()} onEdit={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete task" }));

    expect(screen.getByText('Delete "Build a CLI"?')).toBeInTheDocument();
    expect(
      screen.getByText(/2 student submissions and all their feedback/),
    ).toBeInTheDocument();
    expect(deleteTask).not.toHaveBeenCalled();
  });

  it("leaves out the submissions line when there are none", async () => {
    render(<Row task={makeTask({ submissionCount: 0 })} onEdit={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete task" }));

    expect(screen.queryByText(/student submission/)).not.toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("deletes and fires onDeleted when confirmed", async () => {
    const onDeleted = vi.fn();
    render(<Row task={makeTask()} onEdit={vi.fn()} onDeleted={onDeleted} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete task" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete task",
      }),
    );

    expect(deleteTask).toHaveBeenCalledWith(5);
    expect(toastSuccess).toHaveBeenCalled();
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it("does not delete when the dialog is cancelled", async () => {
    render(<Row task={makeTask()} onEdit={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete task" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(deleteTask).not.toHaveBeenCalled();
  });
});
