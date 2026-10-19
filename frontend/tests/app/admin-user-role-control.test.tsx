import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateUserRole = vi.fn();
vi.mock("@features/users/api", () => ({
  updateUserRole: (...args: unknown[]) => updateUserRole(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

// The dropdown can't be opened in jsdom, so this test swaps it for a plain
// <select> with the same values. The page itself keeps the real dropdown.
vi.mock("@components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      aria-label="New role"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

import { ApiError } from "@lib/api-client";
import { RoleControl } from "../../src/app/admin/users/[id]/_components/role-control";

const pickRole = (container: HTMLElement, role: string) => {
  fireEvent.change(container.querySelector("select")!, {
    target: { value: role },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  updateUserRole.mockResolvedValue({});
});

describe("RoleControl", () => {
  it("shows the current role and waits for a different one", () => {
    render(
      <RoleControl
        userId={4}
        userName="Ada"
        role="student"
        onChanged={vi.fn()}
      />,
    );

    // The badge shows the saved role.
    expect(
      screen.getByText("Student", { selector: "span" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change role" })).toBeDisabled();
  });

  it("asks first, then changes the role and reloads the user", async () => {
    const onChanged = vi.fn();
    const { container } = render(
      <RoleControl
        userId={4}
        userName="Ada"
        role="student"
        onChanged={onChanged}
      />,
    );

    pickRole(container, "admin");
    await userEvent.click(screen.getByRole("button", { name: "Change role" }));

    expect(screen.getByText("Change Ada's role?")).toBeInTheDocument();
    expect(updateUserRole).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      Array.from(dialog.querySelectorAll("button")).find(
        (b) => b.textContent === "Change role",
      )!,
    );

    expect(updateUserRole).toHaveBeenCalledWith(4, "admin");
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(toastSuccess).toHaveBeenCalledWith("Ada is now admin.");
  });

  it("warns that moving a student to applicant removes their cohorts", async () => {
    const { container } = render(
      <RoleControl
        userId={4}
        userName="Ada"
        role="student"
        onChanged={vi.fn()}
      />,
    );

    pickRole(container, "applicant");
    await userEvent.click(screen.getByRole("button", { name: "Change role" }));

    expect(
      screen.getByText("They will also be removed from all their cohorts."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "If their application was accepted, it will be pending again.",
      ),
    ).toBeInTheDocument();
  });

  it("says a pending application is accepted when an applicant becomes a student", async () => {
    const { container } = render(
      <RoleControl
        userId={4}
        userName="Ada"
        role="applicant"
        onChanged={vi.fn()}
      />,
    );

    pickRole(container, "student");
    await userEvent.click(screen.getByRole("button", { name: "Change role" }));

    expect(
      screen.getByText(
        "If their application is still pending, it will be accepted.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the server's reason when the change is refused", async () => {
    updateUserRole.mockRejectedValue(
      new ApiError(
        400,
        "This is the only admin. Make another user an admin first.",
      ),
    );
    const onChanged = vi.fn();
    const { container } = render(
      <RoleControl
        userId={1}
        userName="Root"
        role="admin"
        onChanged={onChanged}
      />,
    );

    pickRole(container, "student");
    await userEvent.click(screen.getByRole("button", { name: "Change role" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      Array.from(dialog.querySelectorAll("button")).find(
        (b) => b.textContent === "Change role",
      )!,
    );

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "This is the only admin. Make another user an admin first.",
      ),
    );
    expect(onChanged).not.toHaveBeenCalled();
  });
});
