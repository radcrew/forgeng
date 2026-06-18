import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageContainer } from "@components/shared/page-container";

describe("PageContainer", () => {
  it("renders its children", () => {
    render(
      <PageContainer>
        <p>content</p>
      </PageContainer>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("applies the default 6xl max width and spacing-6", () => {
    render(
      <PageContainer>
        <p>content</p>
      </PageContainer>,
    );
    const container = screen.getByText("content").parentElement;
    expect(container).toHaveClass("max-w-6xl");
    expect(container).toHaveClass("space-y-6");
  });

  it("applies a chosen max width and spacing-8", () => {
    render(
      <PageContainer maxWidth="4xl" spacing="8">
        <p>content</p>
      </PageContainer>,
    );
    const container = screen.getByText("content").parentElement;
    expect(container).toHaveClass("max-w-4xl");
    expect(container).toHaveClass("space-y-8");
  });

  it("merges a custom className", () => {
    render(
      <PageContainer className="custom-x">
        <p>content</p>
      </PageContainer>,
    );
    expect(screen.getByText("content").parentElement).toHaveClass("custom-x");
  });
});
