import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListRow } from "@components/common/list-row";

describe("ListRow", () => {
  it("renders the title", () => {
    render(<ListRow title="Ada Lovelace" />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("renders the subtitle when provided", () => {
    render(<ListRow title="Ada" subtitle="ada@example.com" />);
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("omits the subtitle paragraph when not provided", () => {
    render(<ListRow title="Ada" />);
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
  });

  it("accepts a node as the title", () => {
    render(<ListRow title={<span data-testid="badge">★</span>} />);
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });
});
