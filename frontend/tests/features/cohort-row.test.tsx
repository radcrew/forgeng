import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const deleteCohort = vi.fn();
vi.mock("@features/cohorts/api", () => ({
  deleteCohort: (...args: unknown[]) => deleteCohort(...args),
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
import { CohortRow as Row } from "@features/cohorts/components/row";

function makeCohort(overrides: Partial<Cohort> = {}): Cohort {
  return {
    id: 3,
    name: "Spring 2026",
    description: null,
    capacity: 30,
    enrolledCount: 12,
    status: "active",
    startDate: null,
    endDate: null,
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as Cohort;
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteCohort.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cohort Row", () => {
  it("renders the name, status, and enrollment count", () => {
    render(<Row cohort={makeCohort()} onEdit={vi.fn()} />);
    expect(screen.getByText("Spring 2026")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("12 / 30 students")).toBeInTheDocument();
  });

  it("calls onEdit from the edit button", async () => {
    const onEdit = vi.fn();
    render(<Row cohort={makeCohort()} onEdit={onEdit} />);

    await userEvent.click(screen.getByRole("button", { name: "Edit cohort" }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }));
  });

  it("deletes and fires onDeleted when confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDeleted = vi.fn();
    render(<Row cohort={makeCohort()} onEdit={vi.fn()} onDeleted={onDeleted} />);

    // The delete button is the second one (after Edit cohort).
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[1]);

    expect(deleteCohort).toHaveBeenCalledWith(3);
    expect(toastSuccess).toHaveBeenCalled();
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it("does not delete when the confirm is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Row cohort={makeCohort()} onEdit={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[1]);

    expect(deleteCohort).not.toHaveBeenCalled();
  });
});
