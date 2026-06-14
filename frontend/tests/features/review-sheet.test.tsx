import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refetchFeedback = vi.fn();
let feedbackData: unknown[];
vi.mock("@features/submissions/hooks", () => ({
  useSubmissionFeedback: () => ({
    data: feedbackData,
    refetch: refetchFeedback,
  }),
}));

const createFeedback = vi.fn();
vi.mock("@features/submissions/api", () => ({
  createFeedback: (...args: unknown[]) => createFeedback(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import type { Submission } from "@types";
import { ReviewSheet } from "@features/submissions/components/review-sheet";

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 10,
    taskId: 5,
    userId: 2,
    content: "My write-up",
    repoUrl: "https://github.com/ada/project",
    status: "submitted",
    feedbackCount: 0,
    createdAt: "2026-01-15T10:30:00.000Z",
    task: { id: 5, title: "Build a CLI" },
    user: { id: 2, name: "Ada", email: "ada@example.com" },
    ...overrides,
  } as Submission;
}

beforeEach(() => {
  vi.clearAllMocks();
  feedbackData = [];
  createFeedback.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReviewSheet", () => {
  it("renders the task title and student write-up", () => {
    render(<ReviewSheet submission={makeSubmission()} open onClose={vi.fn()} />);
    expect(screen.getByText("Build a CLI")).toBeInTheDocument();
    expect(screen.getByText("My write-up")).toBeInTheDocument();
  });

  it("shows the leave-feedback section for a submitted submission", () => {
    render(<ReviewSheet submission={makeSubmission()} open onClose={vi.fn()} />);
    expect(screen.getByText("Leave Feedback")).toBeInTheDocument();
  });

  it("hides the leave-feedback section once approved", () => {
    render(
      <ReviewSheet
        submission={makeSubmission({ status: "approved" })}
        open
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText("Leave Feedback")).not.toBeInTheDocument();
  });

  it("disables submit until feedback text is entered", () => {
    render(<ReviewSheet submission={makeSubmission()} open onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("submits feedback and closes on success", async () => {
    const onClose = vi.fn();
    const onReviewed = vi.fn();
    render(
      <ReviewSheet
        submission={makeSubmission()}
        open
        onClose={onClose}
        onReviewed={onReviewed}
      />,
    );

    await userEvent.type(
      screen.getByPlaceholderText(/write your feedback/i),
      "Looks good",
    );
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(createFeedback).toHaveBeenCalledWith(10, {
      content: "Looks good",
      verdict: "approved",
    });
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(onReviewed).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
