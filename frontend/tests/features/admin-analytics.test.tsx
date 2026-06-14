import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AdminDashboard } from "@types";
import { AdminAnalytics } from "@features/dashboard/components/admin-analytics";

function make(overrides: Partial<AdminDashboard> = {}): AdminDashboard {
  return {
    applicationStats: { total: 6, pending: 2, accepted: 3, rejected: 1 },
    activeCohorts: 1,
    totalStudents: 10,
    pendingReviews: 2,
    recentApplications: [],
    recentSubmissions: [],
    analytics: {
      submissionBreakdown: { submitted: 2, approved: 5, needsWork: 1 },
      weeklyActivity: [],
      cohortStats: [
        { id: 1, name: "Spring", status: "active", students: 5, tasks: 3, submissions: 7 },
      ],
    },
    ...overrides,
  } as AdminDashboard;
}

describe("AdminAnalytics", () => {
  it("renders the application and submission section headings", () => {
    render(<AdminAnalytics dashboard={make()} />);
    expect(
      screen.getByRole("link", { name: "Applications" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Submissions" }),
    ).toBeInTheDocument();
  });

  it("renders the cohort stats row", () => {
    render(<AdminAnalytics dashboard={make()} />);
    expect(screen.getByText("Spring")).toBeInTheDocument();
    // students / tasks / submissions cells from the fixture.
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("shows an empty cohorts message when there are none", () => {
    render(
      <AdminAnalytics
        dashboard={make({
          analytics: {
            submissionBreakdown: { submitted: 0, approved: 0, needsWork: 0 },
            weeklyActivity: [],
            cohortStats: [],
          },
        })}
      />,
    );
    expect(screen.getByText("No cohorts yet.")).toBeInTheDocument();
  });

  it("shows the segmented-bar empty state when a breakdown is all zero", () => {
    render(
      <AdminAnalytics
        dashboard={make({
          applicationStats: { total: 0, pending: 0, accepted: 0, rejected: 0 },
          analytics: {
            submissionBreakdown: { submitted: 0, approved: 0, needsWork: 0 },
            weeklyActivity: [],
            cohortStats: [],
          },
        })}
      />,
    );
    expect(screen.getAllByText("No data yet.").length).toBeGreaterThan(0);
  });
});
