import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Submission } from "@types";

let feedbackState: {
  data: unknown[] | undefined;
  isLoading: boolean;
  error: Error | null;
};
const refetch = vi.fn();

vi.mock("@features/submissions/hooks", () => ({
  useSubmissionFeedback: () => ({ ...feedbackState, refetch }),
}));

const resubmitSubmission = vi.fn();
vi.mock("@features/submissions/api", () => ({
  resubmitSubmission: (...args: unknown[]) => resubmitSubmission(...args),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { SubmissionDetailSheet } from "@features/submissions/components/student/detail-sheet";

const submission: Submission = {
  id: 10,
  taskId: 5,
  task: { id: 5, title: "Build a CLI", type: "coding" },
  content: "My work",
  repoUrl: null,
  status: "submitted",
  feedbackCount: 0,
  lastSubmittedAt: "2026-01-15T12:00:00.000Z",
  createdAt: "2026-01-15T12:00:00.000Z",
};

const renderSheet = () =>
  render(
    <SubmissionDetailSheet submission={submission} open onClose={vi.fn()} />,
  );

beforeEach(() => {
  refetch.mockClear();
  resubmitSubmission.mockReset();
  resubmitSubmission.mockResolvedValue(undefined);
});

describe("student SubmissionDetailSheet resubmit", () => {
  it("sends a cleared repo link as null so it is removed", async () => {
    feedbackState = { data: [], isLoading: false, error: null };
    render(
      <SubmissionDetailSheet
        submission={{
          ...submission,
          status: "needs_work",
          repoUrl: "https://github.com/me/old",
        }}
        open
        onClose={vi.fn()}
      />,
    );

    await userEvent.clear(screen.getByLabelText("Repository URL (optional)"));
    await userEvent.click(
      screen.getByRole("button", { name: "Resubmit for Review" }),
    );

    expect(resubmitSubmission).toHaveBeenCalledWith(10, {
      content: "My work",
      repoUrl: null,
    });
  });
});

describe("student SubmissionDetailSheet feedback", () => {
  it("shows placeholders, not 'No feedback yet', while loading", () => {
    feedbackState = { data: undefined, isLoading: true, error: null };
    renderSheet();

    expect(screen.getAllByTestId("feedback-placeholder")).toHaveLength(2);
    expect(screen.queryByText(/No feedback yet/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
  });

  it("shows an error with a retry when feedback fails to load", async () => {
    feedbackState = {
      data: undefined,
      isLoading: false,
      error: new Error("x"),
    };
    renderSheet();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't load the feedback.",
    );
    expect(screen.queryByText(/No feedback yet/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("links to the task page", () => {
    feedbackState = { data: [], isLoading: false, error: null };
    renderSheet();

    expect(screen.getByRole("link", { name: "View task" })).toHaveAttribute(
      "href",
      "/student/tasks/5",
    );
  });

  it("leaves out the task link when asked to", () => {
    feedbackState = { data: [], isLoading: false, error: null };
    render(
      <SubmissionDetailSheet
        submission={submission}
        open
        onClose={vi.fn()}
        showTaskLink={false}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "View task" }),
    ).not.toBeInTheDocument();
  });

  it("says 'No feedback yet' once it knows there is none", () => {
    feedbackState = { data: [], isLoading: false, error: null };
    renderSheet();

    expect(screen.getByText(/No feedback yet/)).toBeInTheDocument();
    expect(screen.getByText("Feedback (0)")).toBeInTheDocument();
  });
});
