import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useUsers = vi.fn();

vi.mock("@features/users", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/users")>()),
  useUsers: (...args: unknown[]) => useUsers(...args),
}));

import Page from "../../src/app/admin/users/page";

beforeEach(() => {
  useUsers.mockReset();
  useUsers.mockReturnValue({
    data: { items: [], total: 0, page: 1, pageSize: 20 },
    isLoading: false,
  });
});

describe("admin users page", () => {
  it("starts on students, as before", () => {
    render(<Page />);

    expect(useUsers).toHaveBeenLastCalledWith("student", 1, 20, "");
    expect(screen.getByText("No students yet.")).toBeInTheDocument();
  });

  it("shows applicants or admins when their tab is picked", async () => {
    render(<Page />);

    await userEvent.click(screen.getByRole("tab", { name: "Applicants" }));
    expect(useUsers).toHaveBeenLastCalledWith("applicant", 1, 20, "");
    expect(screen.getByText("No applicants yet.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Admins" }));
    expect(useUsers).toHaveBeenLastCalledWith("admin", 1, 20, "");
  });

  it("searches by name or email once typing pauses", async () => {
    render(<Page />);

    await userEvent.type(
      screen.getByRole("textbox", { name: "Search users by name or email" }),
      "ada",
    );

    await waitFor(() =>
      expect(useUsers).toHaveBeenLastCalledWith("student", 1, 20, "ada"),
    );
    // Not once per letter: "a" and "ad" were never sent.
    expect(useUsers).not.toHaveBeenCalledWith("student", 1, 20, "a");
    expect(useUsers).not.toHaveBeenCalledWith("student", 1, 20, "ad");
    expect(screen.getByText('No students match "ada".')).toBeInTheDocument();
  });

  it("shows everyone on the All tab", async () => {
    render(<Page />);

    await userEvent.click(screen.getByRole("tab", { name: "All" }));
    expect(useUsers).toHaveBeenLastCalledWith("all", 1, 20, "");
    expect(screen.getByText("No users yet.")).toBeInTheDocument();
  });
});
