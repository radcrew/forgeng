import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let dashboard: unknown;
let profileComplete = false;

vi.mock("@contexts", () => ({
  useSelectedCohort: () => ({ selectedCohortId: undefined }),
  useCurrentUser: () => ({ user: { id: 1 } }),
}));

vi.mock("@utils/user", () => ({
  isProfileComplete: () => profileComplete,
}));

vi.mock("@features/dashboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/dashboard")>()),
  useStudentDashboard: () => ({
    data: dashboard,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  StudentView: () => <div>Your tasks and progress</div>,
}));

// Its own tests cover it. Here it only stands in, so the page test makes no
// network call.
vi.mock("@features/mentors", () => ({
  MentorBookingCard: () => <div>Book a meeting with a mentor</div>,
}));

import Page from "../../src/app/student/page";

const withCohort = {
  cohort: { id: 3, name: "Spring" },
  cohorts: [{ id: 3, name: "Spring" }],
};

beforeEach(() => {
  profileComplete = false;
});

describe("student dashboard page", () => {
  it("keeps the dashboard visible when the profile is incomplete", () => {
    dashboard = withCohort;
    render(<Page />);

    expect(screen.getByText("Your tasks and progress")).toBeInTheDocument();
    expect(screen.getByText(/Your profile is incomplete/)).toBeInTheDocument();
  });

  it("shows no reminder when the profile is complete", () => {
    dashboard = withCohort;
    profileComplete = true;
    render(<Page />);

    expect(screen.queryByText(/Your profile is incomplete/)).not.toBeInTheDocument();
  });

  it("asks to finish the profile before the student has a cohort", () => {
    dashboard = { cohort: null, cohorts: [] };
    render(<Page />);

    expect(screen.getByText("Finish your profile to get placed.")).toBeInTheDocument();
  });

  it.each([
    ["with a cohort", withCohort],
    ["before a cohort", { cohort: null, cohorts: [] }],
  ])("offers a meeting with a mentor %s", (_, value) => {
    dashboard = value;
    render(<Page />);

    expect(screen.getByText("Book a meeting with a mentor")).toBeInTheDocument();
  });
});
