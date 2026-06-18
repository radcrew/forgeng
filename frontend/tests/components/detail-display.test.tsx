import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DetailField,
  DetailGrid,
  ProseBlock,
  SectionTitle,
} from "@components/common/detail-display";

describe("detail-display primitives", () => {
  it("DetailField renders its label and value", () => {
    render(<DetailField label="Email" value="ada@example.com" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("DetailField accepts a node as its value", () => {
    render(<DetailField label="Link" value={<a href="/x">open</a>} />);
    expect(screen.getByRole("link", { name: "open" })).toBeInTheDocument();
  });

  it("SectionTitle renders as a heading", () => {
    render(<SectionTitle>Wallets</SectionTitle>);
    expect(
      screen.getByRole("heading", { name: "Wallets" }),
    ).toBeInTheDocument();
  });

  it("ProseBlock renders multi-line content", () => {
    render(<ProseBlock>Some longer note.</ProseBlock>);
    expect(screen.getByText("Some longer note.")).toBeInTheDocument();
  });

  it("DetailGrid renders its children", () => {
    render(
      <DetailGrid>
        <DetailField label="A" value="1" />
        <DetailField label="B" value="2" />
      </DetailGrid>,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
