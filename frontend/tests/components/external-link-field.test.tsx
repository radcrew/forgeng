import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExternalLinkField } from "@components/common/external-link-field";

describe("ExternalLinkField", () => {
  it("renders the href as a link opening in a new tab", () => {
    render(<ExternalLinkField href="https://github.com/ada/project" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://github.com/ada/project");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("defaults the title to Repository", () => {
    render(<ExternalLinkField href="https://example.com" />);
    expect(screen.getByText("Repository")).toBeInTheDocument();
  });

  it("renders a custom title when provided", () => {
    render(<ExternalLinkField href="https://example.com" title="Portfolio" />);
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
  });
});
