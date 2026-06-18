import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubmissionStatusBadge as StatusBadge } from "@features/submissions/components/status-badge";

describe("submission StatusBadge", () => {
  it("renders the humanized status label", () => {
    render(<StatusBadge status="needs_work" />);
    expect(screen.getByText("needs work")).toBeInTheDocument();
  });

  it("shows a leading icon for an approved submission by default", () => {
    const { container } = render(<StatusBadge status="approved" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows a leading icon for a needs_work submission", () => {
    const { container } = render(<StatusBadge status="needs_work" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("omits the icon when showIcon is false", () => {
    const { container } = render(
      <StatusBadge status="approved" showIcon={false} />,
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("shows no icon for a status without one (submitted)", () => {
    const { container } = render(<StatusBadge status="submitted" />);
    expect(container.querySelector("svg")).toBeNull();
  });
});
