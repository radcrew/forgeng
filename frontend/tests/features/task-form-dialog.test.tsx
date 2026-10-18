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
import { TaskFormDialog as FormDialog } from "@features/tasks/components/form-dialog";

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

  it("asks for a cohort before creating a task", async () => {
    render(<FormDialog open onOpenChange={vi.fn()} />);
    await userEvent.type(
      screen.getByPlaceholderText("Task title..."),
      "New task",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create Task" }));

    expect(screen.getByText("Select a cohort.")).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
  });

  it("keeps create disabled while the title is only spaces", async () => {
    render(<FormDialog open onOpenChange={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText("Task title..."), "   ");

    expect(
      screen.getByRole("button", { name: "Create Task" }),
    ).toBeDisabled();
  });

  it("sends the title without spaces around it", async () => {
    render(<FormDialog task={makeTask()} open onOpenChange={vi.fn()} />);
    const input = screen.getByPlaceholderText("Task title...");
    await userEvent.clear(input);
    await userEvent.type(input, "  Build a CLI  ");
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(updateTask).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ title: "Build a CLI" }),
    );
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

  it("still saves a task published before the due date rule", async () => {
    // Older published tasks may have no due date. Fixing a typo must work.
    render(
      <FormDialog
        task={makeTask({ status: "published", dueDate: null })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      screen.queryByText("Add a due date before publishing."),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(updateTask).toHaveBeenCalledTimes(1));
  });

  it("lets a draft be saved without a due date", () => {
    render(
      <FormDialog
        task={makeTask({ status: "draft", dueDate: null })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByText("Add a due date before publishing."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
  });

  it("locks the cohort when editing a task", () => {
    render(<FormDialog task={makeTask()} open onOpenChange={vi.fn()} />);

    expect(screen.getByRole("combobox", { name: "Cohort" })).toBeDisabled();
    expect(
      screen.getByText("A task can't move to another cohort."),
    ).toBeInTheDocument();
  });

  it("lets the cohort be chosen when creating a task", () => {
    render(<FormDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByRole("combobox", { name: "Cohort" })).toBeEnabled();
  });

  it("toasts an error when the update fails", async () => {
    updateTask.mockRejectedValue(new Error("nope"));
    render(<FormDialog task={makeTask()} open onOpenChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
