import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "@components/common/status-badge";

const variantMap = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
} as const;

describe("StatusBadge", () => {
  it("renders the humanized status as its label by default", () => {
    render(<StatusBadge status="pending" variantMap={variantMap} />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("formats an underscored status into spaced words", () => {
    const map = { needs_work: "secondary" } as const;
    render(<StatusBadge status="needs_work" variantMap={map} />);
    expect(screen.getByText("needs work")).toBeInTheDocument();
  });

  it("prefers an explicit label over the status text", () => {
    render(
      <StatusBadge status="accepted" variantMap={variantMap} label="Approved" />,
    );
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.queryByText("accepted")).not.toBeInTheDocument();
  });

  it("renders a leading icon when provided", () => {
    render(
      <StatusBadge
        status="rejected"
        variantMap={variantMap}
        leadingIcon={<span data-testid="icon" />}
      />,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
