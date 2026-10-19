import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

let selectedCohortId: number | undefined;
let dashboard: unknown;
let dashboardLoading = false;
let dashboardError: Error | null = null;
const refetchDashboard = vi.fn();
const useSubmissions = vi.fn();

vi.mock("@contexts", () => ({
  useSelectedCohort: () => ({ selectedCohortId }),
}));

vi.mock("@features/dashboard", () => ({
  useStudentDashboard: (cohortId?: number) => ({
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
    requested: cohortId,
  }),
  CohortSwitcher: ({
    cohorts,
    disabled,
  }: {
    cohorts: { name: string }[];
    disabled?: boolean;
  }) => (
    <div>
      Switch between {cohorts.map((c) => c.name).join(", ")}
      {disabled ? " (locked)" : ""}
    </div>
  ),
}));

vi.mock("@features/submissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/submissions")>()),
  useSubmissions: (options: unknown) => useSubmissions(options),
}));

import Page from "../../src/app/student/submissions/page";

beforeEach(() => {
  dashboardLoading = false;
  dashboardError = null;
  refetchDashboard.mockClear();
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

    expect(useSubmissions).toHaveBeenLastCalledWith({
      cohortId: 7,
      enabled: true,
    });
  });

  it("shows loading, not the old cohort, while a switched cohort loads", () => {
    // The hook still holds the old cohort's dashboard and submissions.
    selectedCohortId = 3;
    dashboard = {
      cohort: { id: 7, name: "Autumn" },
      cohorts: [
        { id: 3, name: "Spring" },
        { id: 7, name: "Autumn" },
      ],
    };
    dashboardLoading = true;
    useSubmissions.mockReturnValue({
      data: [{ id: 1, status: "submitted", task: { title: "Old task" } }],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<Page />);

    expect(screen.getByText("Loading submissions…")).toBeInTheDocument();
    expect(screen.queryByText(/Autumn —/)).not.toBeInTheDocument();
    expect(screen.queryByText("Old task")).not.toBeInTheDocument();
    expect(screen.getByText(/(locked)/)).toBeInTheDocument();
  });

  it("shows an error with a retry when the dashboard fails to load", async () => {
    selectedCohortId = 7;
    dashboard = undefined;
    dashboardError = new Error("offline");
    // The submissions load is still waiting for the dashboard, so it is not
    // loading. Before, it said "loading", and the page never left its spinner.
    useSubmissions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<Page />);

    expect(screen.queryByText("Loading submissions…")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't load your submissions.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetchDashboard).toHaveBeenCalledTimes(1);
  });

  it("closes resubmitting for ended-cohort work when the student has no current cohort", async () => {
    // With no current cohort the page lists work from every cohort, so the
    // panel must use each submission's own cohortEnded from the server.
    selectedCohortId = undefined;
    dashboard = { cohort: null, cohorts: [] };
    useSubmissions.mockReturnValue({
      data: [
        {
          id: 1,
          taskId: 1,
          task: { id: 1, title: "Old cohort task", type: "coding" },
          content: "My work",
          repoUrl: null,
          status: "needs_work",
          feedbackCount: 0,
          cohortEnded: true,
          createdAt: "2026-01-15T12:00:00.000Z",
          lastSubmittedAt: "2026-01-15T12:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<Page />);

    await userEvent.click(screen.getByText("Old cohort task"));

    expect(
      await screen.findByText(
        "This cohort has ended, so it no longer accepts resubmissions.",
      ),
    ).toBeInTheDocument();
  });

  it("waits for the dashboard before loading any submissions", () => {
    // Without the dashboard the cohort is unknown, so loading now would
    // fetch every cohort's submissions only to throw them away.
    selectedCohortId = 7;
    dashboard = undefined;
    render(<Page />);

    expect(useSubmissions).toHaveBeenLastCalledWith({
      cohortId: undefined,
      enabled: false,
    });
    expect(screen.getByText("Loading submissions…")).toBeInTheDocument();
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
      lastSubmittedAt: "2026-01-15T10:30:00.000Z",
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

  it("shows when work was sent again, and only then", () => {
    selectedCohortId = 7;
    dashboard = {
      cohort: { id: 7, name: "Autumn" },
      cohorts: [{ id: 7, name: "Autumn" }],
    };
    const base = {
      task: { id: 1, title: "Build a CLI", type: "coding" },
      content: "My work",
      repoUrl: null,
      status: "submitted",
      feedbackCount: 0,
    };
    useSubmissions.mockReturnValue({
      data: [
        {
          ...base,
          id: 1,
          taskId: 1,
          createdAt: "2026-01-15T12:00:00.000Z",
          lastSubmittedAt: "2026-01-20T12:00:00.000Z",
        },
        {
          ...base,
          id: 2,
          taskId: 2,
          task: { id: 2, title: "Read the docs", type: "reading" },
          createdAt: "2026-01-16T12:00:00.000Z",
          lastSubmittedAt: "2026-01-16T12:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<Page />);

    expect(
      screen.getByText(/Submitted Jan 15, 2026 · Resubmitted Jan 20, 2026/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Submitted Jan 16, 2026$/)).toBeInTheDocument();
  });

  it("marks work resubmitted even when it was sent again within a minute", () => {
    selectedCohortId = 7;
    dashboard = {
      cohort: { id: 7, name: "Autumn" },
      cohorts: [{ id: 7, name: "Autumn" }],
    };
    useSubmissions.mockReturnValue({
      data: [
        {
          id: 1,
          taskId: 1,
          task: { id: 1, title: "Build a CLI", type: "coding" },
          content: "My work",
          repoUrl: null,
          status: "submitted",
          feedbackCount: 0,
          createdAt: "2026-01-15T12:00:00.000Z",
          lastSubmittedAt: "2026-01-15T12:00:30.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<Page />);

    expect(screen.getByText(/Resubmitted Jan 15, 2026/)).toBeInTheDocument();
  });

  it("says in words how many feedback comments a submission has", () => {
    selectedCohortId = 7;
    dashboard = {
      cohort: { id: 7, name: "Autumn" },
      cohorts: [{ id: 7, name: "Autumn" }],
    };
    useSubmissions.mockReturnValue({
      data: [
        {
          id: 1,
          taskId: 1,
          task: { id: 1, title: "Build a CLI", type: "coding" },
          content: "My work",
          repoUrl: null,
          status: "needs_work",
          feedbackCount: 2,
          lastSubmittedAt: "2026-01-15T12:00:00.000Z",
          createdAt: "2026-01-15T12:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<Page />);

    expect(screen.getByText("feedback comments")).toBeInTheDocument();
  });

  it("waits for the cohort before showing the list", () => {
    selectedCohortId = undefined;
    dashboard = undefined;
    render(<Page />);

    expect(screen.getByText("Loading submissions…")).toBeInTheDocument();
    expect(screen.queryByText(/No submissions yet/)).not.toBeInTheDocument();
  });
});
