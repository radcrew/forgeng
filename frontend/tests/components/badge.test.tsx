import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "@components/ui/badge";

describe("Badge", () => {
  it("renders its content", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies the default variant classes", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toHaveClass("bg-primary");
  });

  it("applies a chosen variant", () => {
    render(<Badge variant="destructive">Rejected</Badge>);
    expect(screen.getByText("Rejected")).toHaveClass("bg-destructive");
  });

  it("merges a custom className", () => {
    render(<Badge className="custom-x">Tagged</Badge>);
    expect(screen.getByText("Tagged")).toHaveClass("custom-x");
  });
});
