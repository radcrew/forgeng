import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeedbackCard } from "@components/common/feedback-card";

const base = {
  authorName: "Grace Hopper",
  content: "Solid work, ship it.",
  createdAt: "2026-01-15T10:30:00.000Z",
};

describe("FeedbackCard", () => {
  it("renders the author and content", () => {
    render(<FeedbackCard {...base} verdict="approved" />);
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("Solid work, ship it.")).toBeInTheDocument();
  });

  it("labels an approved verdict as Approved", () => {
    render(<FeedbackCard {...base} verdict="approved" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("labels a needs_work verdict as Needs Work", () => {
    render(<FeedbackCard {...base} verdict="needs_work" />);
    expect(screen.getByText("Needs Work")).toBeInTheDocument();
  });

  it("formats the created date as a friendly string", () => {
    render(<FeedbackCard {...base} verdict="approved" />);
    expect(screen.getByText("Jan 15, 2026")).toBeInTheDocument();
  });
});
