import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingState } from "@components/common/loading-state";

describe("LoadingState", () => {
  it("renders a default loading message", () => {
    render(<LoadingState />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders a custom message", () => {
    render(<LoadingState message="Fetching cohorts…" />);
    expect(screen.getByText("Fetching cohorts…")).toBeInTheDocument();
  });
});
