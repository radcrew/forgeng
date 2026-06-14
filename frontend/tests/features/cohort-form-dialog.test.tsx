import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createCohort = vi.fn();
const updateCohort = vi.fn();
vi.mock("@features/cohorts/api", () => ({
  createCohort: (...args: unknown[]) => createCohort(...args),
  updateCohort: (...args: unknown[]) => updateCohort(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import type { Cohort } from "@types";
import { FormDialog } from "@features/cohorts/components/form-dialog";

function makeCohort(overrides: Partial<Cohort> = {}): Cohort {
  return {
    id: 3,
    name: "Spring 2026",
    description: null,
    capacity: 30,
    enrolledCount: 0,
    status: "draft",
    startDate: null,
    endDate: null,
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as Cohort;
}

beforeEach(() => {
  vi.clearAllMocks();
  createCohort.mockResolvedValue(undefined);
  updateCohort.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cohort FormDialog", () => {
  it("disables create submit until a name is entered", async () => {
    render(<FormDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Create Cohort")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();

    await userEvent.type(
      screen.getByPlaceholderText(/Spring 2026/i),
      "Summer",
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("creates a cohort with the default capacity and entered name", async () => {
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <FormDialog open onOpenChange={onOpenChange} onSaved={onSaved} />,
    );

    await userEvent.type(screen.getByPlaceholderText(/Spring 2026/i), "Summer");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(createCohort).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Summer", capacity: 20, status: "draft" }),
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("edits an existing cohort via updateCohort", async () => {
    render(<FormDialog cohort={makeCohort()} open onOpenChange={vi.fn()} />);

    expect(screen.getByText("Edit Cohort")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(updateCohort).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ name: "Spring 2026", capacity: 30 }),
    );
  });

  it("toasts an error when the create fails", async () => {
    createCohort.mockRejectedValue(new Error("nope"));
    render(<FormDialog open onOpenChange={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/Spring 2026/i), "Summer");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
