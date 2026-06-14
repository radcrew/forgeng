import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@components/shared/empty-state";

describe("EmptyState", () => {
  it("renders a simple message", () => {
    render(<EmptyState message="No applications yet" />);
    expect(screen.getByText("No applications yet")).toBeInTheDocument();
  });

  it("renders children and ignores message when both are given", () => {
    render(
      <EmptyState message="ignored">
        <button>Create one</button>
      </EmptyState>,
    );
    expect(
      screen.getByRole("button", { name: "Create one" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("ignored")).not.toBeInTheDocument();
  });
});
