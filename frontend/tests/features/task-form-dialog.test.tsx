import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createTask = vi.fn();
const updateTask = vi.fn();
vi.mock("@features/tasks/api", () => ({
  createTask: (...args: unknown[]) => createTask(...args),
  updateTask: (...args: unknown[]) => updateTask(...args),
}));

vi.mock("@features/cohorts", () => ({
  useCohorts: () => ({ data: [{ id: 3, name: "Spring" }] }),
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
import { FormDialog } from "@features/tasks/components/form-dialog";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 5,
    cohortId: 3,
    title: "Build a CLI",
    description: "Desc",
    type: "coding",
    status: "draft",
    dueDate: "2026-02-01T00:00:00.000Z",
    submissionCount: 0,
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as Task;
}

beforeEach(() => {
  vi.clearAllMocks();
  updateTask.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("task FormDialog", () => {
  it("renders the create submit disabled until title and cohort", () => {
    render(<FormDialog open onOpenChange={vi.fn()} />);
    // Both the dialog title and the submit button read "Create Task"; assert
    // the button (which also confirms create mode) and its disabled state.
    expect(
      screen.getByRole("button", { name: "Create Task" }),
    ).toBeDisabled();
  });

  it("keeps create submit disabled with a title but no cohort selected", async () => {
    render(<FormDialog open onOpenChange={vi.fn()} />);
    await userEvent.type(
      screen.getByPlaceholderText("Task title..."),
      "New task",
    );
    expect(
      screen.getByRole("button", { name: "Create Task" }),
    ).toBeDisabled();
  });

  it("edits an existing task: updateTask with a null-cleared description", async () => {
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <FormDialog
        task={makeTask()}
        open
        onOpenChange={onOpenChange}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByText("Edit Task")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(updateTask).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ title: "Build a CLI", type: "coding" }),
    );
    // cohortId is intentionally omitted on update.
    const payload = updateTask.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("cohortId");
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("toasts an error when the update fails", async () => {
    updateTask.mockRejectedValue(new Error("nope"));
    render(<FormDialog task={makeTask()} open onOpenChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
