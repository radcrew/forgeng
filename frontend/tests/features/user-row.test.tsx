import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { UserProfile } from "@types";
import { Row } from "@features/users/components/row";

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 1,
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "student",
    githubUrl: null,
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as UserProfile;
}

describe("user Row", () => {
  it("renders the user name and email", () => {
    render(<Row user={makeUser()} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("shows an em dash when the name is null", () => {
    render(<Row user={makeUser({ name: null })} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("derives the avatar initial from the name", () => {
    render(<Row user={makeUser({ name: "Grace" })} />);
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("falls back to the email initial when the name is null", () => {
    render(<Row user={makeUser({ name: null, email: "zoe@example.com" })} />);
    expect(screen.getByText("Z")).toBeInTheDocument();
  });

  it("renders the github url when present", () => {
    render(<Row user={makeUser({ githubUrl: "https://github.com/ada" })} />);
    expect(screen.getByText("https://github.com/ada")).toBeInTheDocument();
  });

  it("links to the user detail page", () => {
    render(<Row user={makeUser()} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/admin/users/1",
    );
  });
});
