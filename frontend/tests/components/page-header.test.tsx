import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "@components/shared/page-header";

describe("PageHeader", () => {
  it("renders the title as a top-level heading", () => {
    render(<PageHeader title="Cohorts" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Cohorts" }),
    ).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(<PageHeader title="Cohorts" description="Manage your cohorts" />);
    expect(screen.getByText("Manage your cohorts")).toBeInTheDocument();
  });

  it("renders action nodes", () => {
    render(
      <PageHeader title="Cohorts" actions={<button>New Cohort</button>} />,
    );
    expect(
      screen.getByRole("button", { name: "New Cohort" }),
    ).toBeInTheDocument();
  });

  it("omits the description paragraph when not provided", () => {
    render(<PageHeader title="Cohorts" />);
    expect(screen.queryByText("Manage your cohorts")).not.toBeInTheDocument();
  });
});
