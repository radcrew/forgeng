import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
import { Row } from "@features/tasks/components/row";

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("task Row", () => {
  it("renders the title, type, status, and submission count", () => {
    render(<Row task={makeTask()} onEdit={vi.fn()} />);
    expect(screen.getByText("Build a CLI")).toBeInTheDocument();
    expect(screen.getByText("published")).toBeInTheDocument();
    expect(screen.getByText("2 submissions")).toBeInTheDocument();
  });

  it("formats the due date", () => {
    render(<Row task={makeTask()} onEdit={vi.fn()} />);
    // Compute the expected label the same way the component does so the test
    // is robust to the runner's local timezone. The date is its own text node.
    const due = format(new Date("2026-02-01T00:00:00.000Z"), "MMM d, yyyy");
    expect(screen.getByText(`Due ${due}`)).toBeInTheDocument();
  });

  it("calls onEdit from the edit button", async () => {
    const onEdit = vi.fn();
    render(<Row task={makeTask()} onEdit={onEdit} />);

    // The first ghost icon button is edit, the second is delete.
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[0]);

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }));
  });

  it("deletes and fires onDeleted when the confirm is accepted", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDeleted = vi.fn();
    render(<Row task={makeTask()} onEdit={vi.fn()} onDeleted={onDeleted} />);

    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[1]);

    expect(deleteTask).toHaveBeenCalledWith(5);
    expect(toastSuccess).toHaveBeenCalled();
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the delete confirm is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Row task={makeTask()} onEdit={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[1]);

    expect(deleteTask).not.toHaveBeenCalled();
  });
});
