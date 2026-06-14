import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContentDialog } from "@components/common/content-dialog";

describe("ContentDialog", () => {
  it("does not render content while closed", () => {
    render(
      <ContentDialog open={false} onOpenChange={vi.fn()} title="Details">
        <p>body</p>
      </ContentDialog>,
    );
    expect(screen.queryByText("Details")).not.toBeInTheDocument();
    expect(screen.queryByText("body")).not.toBeInTheDocument();
  });

  it("renders the title and children when open", () => {
    render(
      <ContentDialog open onOpenChange={vi.fn()} title="Details">
        <p>body</p>
      </ContentDialog>,
    );
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });
});
