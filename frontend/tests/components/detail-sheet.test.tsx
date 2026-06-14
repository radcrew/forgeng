import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DetailSheet } from "@components/common/detail-sheet";

describe("DetailSheet", () => {
  it("does not render content while closed", () => {
    render(
      <DetailSheet open={false} onClose={vi.fn()} title="Submission">
        <p>body</p>
      </DetailSheet>,
    );
    expect(screen.queryByText("Submission")).not.toBeInTheDocument();
    expect(screen.queryByText("body")).not.toBeInTheDocument();
  });

  it("renders the title and children when open", () => {
    render(
      <DetailSheet open onClose={vi.fn()} title="Submission">
        <p>body</p>
      </DetailSheet>,
    );
    expect(screen.getByText("Submission")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("renders a subtitle node when provided", () => {
    render(
      <DetailSheet
        open
        onClose={vi.fn()}
        title="Submission"
        subtitle={<span>by Ada</span>}
      >
        <p>body</p>
      </DetailSheet>,
    );
    expect(screen.getByText("by Ada")).toBeInTheDocument();
  });
});
