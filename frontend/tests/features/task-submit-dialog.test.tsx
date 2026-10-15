import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
});

describe("TaskSubmitDialog", () => {
  it("sends only once when Submit is clicked twice quickly", async () => {
    // Keep the request pending, like a slow connection.
    createSubmission.mockReturnValue(new Promise(() => {}));
    render(<TaskSubmitDialog task={task} open onOpenChange={vi.fn()} />);

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

    fireEvent.click(screen.getByRole("button", { name: "Submit Work" }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(created));
  });
});
