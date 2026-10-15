import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createSubmission = vi.fn();
vi.mock("@features/submissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/submissions")>()),
  createSubmission: (...args: unknown[]) => createSubmission(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import type { Task } from "@types";
import { TaskSubmitDialog } from "@features/tasks/components/submit-dialog";

const task = { id: 5, title: "Build a CLI" } as Task;

beforeEach(() => {
  vi.clearAllMocks();
  createSubmission.mockResolvedValue(undefined);
});

const fillWriteUp = () =>
  fireEvent.change(screen.getByLabelText(/Write-up/), {
    target: { value: "My notes" },
  });

describe("TaskSubmitDialog", () => {
  it("does not send an empty submission", async () => {
    render(<TaskSubmitDialog task={task} open onOpenChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Submit Work" }));

    expect(
      screen.getByText("Add a repository link or a write-up."),
    ).toBeInTheDocument();
    expect(createSubmission).not.toHaveBeenCalled();
  });

  it("does not send a link without https://", async () => {
    render(<TaskSubmitDialog task={task} open onOpenChange={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/Repository URL/), "github.com/x/y");
    await userEvent.click(screen.getByRole("button", { name: "Submit Work" }));

    expect(
      screen.getByText("Enter a full link that starts with https://"),
    ).toBeInTheDocument();
    expect(createSubmission).not.toHaveBeenCalled();
  });

  it("sends a valid submission", async () => {
    render(<TaskSubmitDialog task={task} open onOpenChange={vi.fn()} />);

    await userEvent.type(
      screen.getByLabelText(/Repository URL/),
      "https://github.com/x/y",
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit Work" }));

    expect(createSubmission).toHaveBeenCalledWith(5, {
      content: undefined,
      repoUrl: "https://github.com/x/y",
    });
  });

  it("sends only once when Submit is clicked twice quickly", () => {
    // Keep the request pending, like a slow connection.
    createSubmission.mockReturnValue(new Promise(() => {}));
    render(<TaskSubmitDialog task={task} open onOpenChange={vi.fn()} />);
    fillWriteUp();

    const submit = screen.getByRole("button", { name: "Submit Work" });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(createSubmission).toHaveBeenCalledTimes(1);
  });

  it("hands the new submission back to the page", async () => {
    const created = { id: 10, taskId: 5, status: "submitted" };
    createSubmission.mockResolvedValue(created);
    const onSubmitted = vi.fn();
    render(
      <TaskSubmitDialog
        task={task}
        open
        onOpenChange={vi.fn()}
        onSubmitted={onSubmitted}
      />,
    );
    fillWriteUp();

    fireEvent.click(screen.getByRole("button", { name: "Submit Work" }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(created));
  });
});
