import { render, screen } from "@testing-library/react";
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
    dashboard = { cohort: { id: 7, name: "Autumn" } };
    render(<Page />);

    expect(useSubmissions).toHaveBeenLastCalledWith({ cohortId: 7 });
  });

  it("waits for the cohort before showing the list", () => {
    selectedCohortId = undefined;
    dashboard = undefined;
    render(<Page />);

    expect(screen.getByText("Loading submissions…")).toBeInTheDocument();
    expect(screen.queryByText(/No submissions yet/)).not.toBeInTheDocument();
  });
});
