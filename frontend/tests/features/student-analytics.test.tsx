import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { StudentAnalytics as Analytics } from "@types";
import { StudentAnalytics } from "@features/dashboard/components/student-analytics";

function make(overrides: Partial<Analytics> = {}): Analytics {
  return {
    statusBreakdown: { todo: 1, submitted: 2, needsWork: 1, approved: 3 },
    typeBreakdown: [
      { type: "project", total: 4, approved: 2 },
      { type: "exercise", total: 2, approved: 2 },
    ],
    weeklyActivity: [],
    ...overrides,
  } as Analytics;
}

describe("StudentAnalytics", () => {
  it("renders each status count", () => {
    render(<StudentAnalytics analytics={make()} />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Needs Work")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("shows an empty state when there are no tasks", () => {
    render(
      <StudentAnalytics
        analytics={make({
          statusBreakdown: { todo: 0, submitted: 0, needsWork: 0, approved: 0 },
          typeBreakdown: [],
        })}
      />,
    );
    expect(screen.getAllByText("No tasks yet.").length).toBeGreaterThan(0);
  });

  it("renders the per-type approved/total ratio", () => {
    render(<StudentAnalytics analytics={make()} />);
    expect(screen.getByText("2/4 approved")).toBeInTheDocument();
    expect(screen.getByText("2/2 approved")).toBeInTheDocument();
  });
});
