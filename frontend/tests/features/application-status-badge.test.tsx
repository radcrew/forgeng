import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApplicationStatusBadge as StatusBadge } from "@features/applications/components/status-badge";

describe("application StatusBadge", () => {
  it("renders the humanized status label", () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("renders each application status", () => {
    const { rerender } = render(<StatusBadge status="accepted" />);
    expect(screen.getByText("accepted")).toBeInTheDocument();

    rerender(<StatusBadge status="rejected" />);
    expect(screen.getByText("rejected")).toBeInTheDocument();
  });
});
