import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const unenrollStudent = vi.fn();
vi.mock("@features/cohorts/api", () => ({
  enrollStudent: vi.fn(),
  unenrollStudent: (...args: unknown[]) => unenrollStudent(...args),
}));

const enrollments = [
  {
    id: 1,
    cohortId: 3,
    userId: 7,
    enrolledAt: "2026-01-15T10:30:00.000Z",
    user: { id: 7, name: "Ada Lovelace", email: "ada@example.com" },
  },
];
const refetch = vi.fn();
vi.mock("@features/cohorts/hooks", () => ({
  useEnrollments: () => ({ data: enrollments, refetch }),
}));

const useUsers = vi.fn();
const refetchStudents = vi.fn();
vi.mock("@features/users", () => ({
  useUsers: (...args: unknown[]) => useUsers(...args),
}));
const studentsResult = (
  items: Array<{ id: number; name: string; email: string }>,
  total = items.length,
) => ({ data: { items, total }, error: null, refetch: refetchStudents });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import type { Cohort } from "@types";
import { Enrollments } from "@features/cohorts/components/enrollments";

const makeCohort = (capacity: number) =>
  ({ id: 3, name: "Spring", capacity }) as Cohort;

beforeEach(() => {
  vi.clearAllMocks();
  useUsers.mockReturnValue(
    studentsResult([{ id: 8, name: "Grace Hopper", email: "grace@example.com" }]),
  );
});

describe("Enrollments", () => {
  it("says the cohort is full and hides the enroll picker", () => {
    render(<Enrollments cohort={makeCohort(1)} open onOpenChange={vi.fn()} />);

    expect(screen.getByText("1 of 1 places taken")).toBeInTheDocument();
    expect(screen.getByText(/This cohort is full/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enroll" }),
    ).not.toBeInTheDocument();
  });

  it("offers the enroll picker while there is room", () => {
    render(<Enrollments cohort={makeCohort(2)} open onOpenChange={vi.fn()} />);

    expect(screen.getByText("1 of 2 places taken")).toBeInTheDocument();
    expect(screen.queryByText(/This cohort is full/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enroll" })).toBeInTheDocument();
  });

  it("removes a student after Remove and then Confirm", async () => {
    unenrollStudent.mockResolvedValue(undefined);
    render(<Enrollments cohort={makeCohort(2)} open onOpenChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(unenrollStudent).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(unenrollStudent).toHaveBeenCalledWith(3, 7);
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it("keeps the student when Cancel is clicked", async () => {
    render(<Enrollments cohort={makeCohort(2)} open onOpenChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(unenrollStudent).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("searches students on the server after typing pauses", async () => {
    render(<Enrollments cohort={makeCohort(2)} open onOpenChange={vi.fn()} />);

    expect(useUsers).toHaveBeenLastCalledWith("student", 1, 20, "");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search students by name or email" }),
      "grace",
    );

    await waitFor(() =>
      expect(useUsers).toHaveBeenLastCalledWith("student", 1, 20, "grace"),
    );
  });

  it("says to search when there are more students than shown", () => {
    useUsers.mockReturnValue(
      studentsResult(
        [{ id: 8, name: "Grace Hopper", email: "grace@example.com" }],
        150,
      ),
    );
    render(<Enrollments cohort={makeCohort(2)} open onOpenChange={vi.fn()} />);

    expect(
      screen.getByText(/Showing the first 20 students. Search to find others./),
    ).toBeInTheDocument();
  });

  it("says when no student is left to enroll", () => {
    // Only the student already in the cohort comes back.
    useUsers.mockReturnValue(
      studentsResult([{ id: 7, name: "Ada Lovelace", email: "ada@example.com" }]),
    );
    render(<Enrollments cohort={makeCohort(2)} open onOpenChange={vi.fn()} />);

    expect(screen.getByText("No students left to enroll.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enroll" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error with a retry when students fail to load", async () => {
    useUsers.mockReturnValue({
      data: undefined,
      error: new Error("boom"),
      refetch: refetchStudents,
    });
    render(<Enrollments cohort={makeCohort(2)} open onOpenChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetchStudents).toHaveBeenCalled();
  });
});
