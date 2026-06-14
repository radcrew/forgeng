import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const update = vi.fn();
vi.mock("@features/applications/hooks", () => ({
  useUpdateApplicationStatus: () => ({ update, isPending: false }),
}));

vi.mock("@features/cohorts", () => ({
  useCohorts: () => ({ data: [] }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import type { Application } from "@types";
import { DetailDialog } from "@features/applications/components/detail-dialog";

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 1,
    userId: 1,
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    background: "My background",
    experience: null,
    motivation: "My motivation",
    linkedin: "https://linkedin.com/in/ada",
    twitter: null,
    facebook: null,
    github: "https://github.com/ada",
    portfolio: null,
    telegram: null,
    whatsapp: null,
    country: "US",
    videoUrl: null,
    wallets: null,
    status: "pending",
    cohortId: null,
    reviewerNote: null,
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as Application;
}

beforeEach(() => {
  vi.clearAllMocks();
  update.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DetailDialog", () => {
  it("renders the applicant details and prose sections", () => {
    render(
      <DetailDialog
        application={makeApplication()}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("My motivation")).toBeInTheDocument();
    expect(screen.getByText("My background")).toBeInTheDocument();
  });

  it("renders only the social links that are present", () => {
    render(
      <DetailDialog
        application={makeApplication()}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Twitter" })).not.toBeInTheDocument();
  });

  it("saves with a null reviewerNote and cohortId for a pending status", async () => {
    const onOpenChange = vi.fn();
    render(
      <DetailDialog
        application={makeApplication()}
        open
        onOpenChange={onOpenChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(update).toHaveBeenCalledWith(1, {
      status: "pending",
      reviewerNote: null,
      cohortId: null,
    });
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("toasts an error when the update fails", async () => {
    update.mockRejectedValue(new Error("nope"));
    render(
      <DetailDialog
        application={makeApplication()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
