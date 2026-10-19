import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Submission } from "@types";

let submissions: Submission[] | undefined = [];
let error: Error | null = null;
const refetch = vi.fn();

vi.mock("@features/cohorts", () => ({
  useCohorts: () => ({ data: [{ id: 3, name: "Spring" }] }),
}));

vi.mock("@features/submissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/submissions")>()),
  useSubmissions: () => ({
    data: submissions,
    isLoading: false,
    error,
    refetch,
  }),
  ReviewSheet: () => null,
}));

import Page from "../../src/app/admin/reviews/page";

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 1,
    taskId: 5,
    task: { id: 5, title: "Build a CLI", type: "coding" },
    user: { id: 2, name: "Ada Lovelace", email: "ada@example.com" },
    content: "done",
    repoUrl: null,
    status: "submitted",
    feedbackCount: 0,
    cohortEnded: false,
    cohort: { id: 3, name: "Spring" },
    lastSubmittedAt: "2026-01-15T10:30:00.000Z",
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as Submission;
}

beforeEach(() => {
  error = null;
  refetch.mockClear();
});

describe("admin review queue page", () => {
  it("shows an error with a retry when the submissions fail to load", async () => {
    submissions = undefined;
    error = new Error("offline");
    render(<Page />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't load submissions.",
    );
    expect(
      screen.queryByText("No submissions in this category."),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("says there are no submissions when the list is empty", () => {
    submissions = [];
    render(<Page />);
    expect(
      screen.getByText("No submissions in this category."),
    ).toBeInTheDocument();
  });

  it("shows the cohort of each submission", () => {
    submissions = [makeSubmission()];
    render(<Page />);
    expect(screen.getByText(/Ada Lovelace · Spring/)).toBeInTheDocument();
  });
});
