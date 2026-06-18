import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Application } from "@types";
import { ApplicationRow as Row } from "@features/applications/components/row";

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 1,
    userId: 1,
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    background: "bg",
    experience: "exp",
    motivation: "why",
    linkedin: "https://linkedin.com/in/ada",
    twitter: "https://twitter.com/ada",
    facebook: "https://facebook.com/ada",
    github: "https://github.com/ada",
    portfolio: null,
    telegram: "https://t.me/ada",
    whatsapp: "+15551234567",
    country: "US",
    videoUrl: "https://example.com/v",
    wallets: null,
    status: "pending",
    cohortId: null,
    reviewerNote: null,
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as Application;
}

describe("application Row", () => {
  it("renders the applicant name, email, and status", () => {
    render(<Row application={makeApplication()} onSelect={vi.fn()} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("formats the created date", () => {
    render(<Row application={makeApplication()} onSelect={vi.fn()} />);
    expect(screen.getByText("Jan 15, 2026")).toBeInTheDocument();
  });

  it("flags an incomplete profile", () => {
    // Drop a required social field so isApplicationComplete returns false.
    render(
      <Row application={makeApplication({ github: null })} onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/incomplete profile/i)).toBeInTheDocument();
  });

  it("does not flag a complete profile", () => {
    render(<Row application={makeApplication()} onSelect={vi.fn()} />);
    expect(screen.queryByText(/incomplete profile/i)).not.toBeInTheDocument();
  });

  it("calls onSelect from the Review button", async () => {
    const onSelect = vi.fn();
    render(<Row application={makeApplication()} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Review" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
