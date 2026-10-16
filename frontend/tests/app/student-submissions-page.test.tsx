import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

let selectedCohortId: number | undefined;
let dashboard: unknown;
const useSubmissions = vi.fn();

vi.mock("@contexts", () => ({
  useSelectedCohort: () => ({ selectedCohortId }),
}));

vi.mock("@features/dashboard", () => ({
  useStudentDashboard: (cohortId?: number) => ({
    data: dashboard,
    error: null,
    refetch: vi.fn(),
    requested: cohortId,
  }),
  CohortSwitcher: ({ cohorts }: { cohorts: { name: string }[] }) => (
    <div>Switch between {cohorts.map((c) => c.name).join(", ")}</div>
  ),
}));

vi.mock("@features/submissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/submissions")>()),
  useSubmissions: (options: unknown) => useSubmissions(options),
}));

import Page from "../../src/app/student/submissions/page";

beforeEach(() => {
  useSubmissions.mockReset();
  useSubmissions.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe("student submissions page", () => {
  it("asks only for the submissions of the student's current cohort", () => {
    selectedCohortId = 7;
    dashboard = {
      cohort: { id: 7, name: "Autumn" },
      cohorts: [{ id: 7, name: "Autumn" }],
    };
    render(<Page />);

    expect(useSubmissions).toHaveBeenLastCalledWith({ cohortId: 7 });
  });

  it("names the cohort in the header and offers the cohort switcher", () => {
    selectedCohortId = 7;
    dashboard = {
      cohort: { id: 7, name: "Autumn" },
      cohorts: [
        { id: 3, name: "Spring" },
        { id: 7, name: "Autumn" },
      ],
    };
    render(<Page />);

    expect(
      screen.getByText("Autumn — your submission history and feedback."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Switch between Spring, Autumn"),
    ).toBeInTheDocument();
  });

  it("filters by status tab and by task title", async () => {
    selectedCohortId = 7;
    dashboard = {
      cohort: { id: 7, name: "Autumn" },
      cohorts: [{ id: 7, name: "Autumn" }],
    };
    const sub = (id: number, title: string, status: string) => ({
      id,
      taskId: id,
      task: { id, title, type: "coding" },
      content: "My work",
      repoUrl: null,
      status,
      feedbackCount: 0,
      createdAt: "2026-01-15T10:30:00.000Z",
    });
    useSubmissions.mockReturnValue({
      data: [
        sub(1, "Build a CLI", "approved"),
        sub(2, "Read the docs", "needs_work"),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<Page />);

    await userEvent.click(screen.getByRole("tab", { name: "Needs Work" }));
    expect(screen.getByText("Read the docs")).toBeInTheDocument();
    expect(screen.queryByText("Build a CLI")).not.toBeInTheDocument();

    await userEvent.type(
      screen.getByRole("textbox", { name: "Search submissions by task title" }),
      "quiz",
    );
    expect(
      screen.getByText("No submissions match these filters."),
    ).toBeInTheDocument();
  });

  it("waits for the cohort before showing the list", () => {
    selectedCohortId = undefined;
    dashboard = undefined;
    render(<Page />);

    expect(screen.getByText("Loading submissions…")).toBeInTheDocument();
    expect(screen.queryByText(/No submissions yet/)).not.toBeInTheDocument();
  });
});
