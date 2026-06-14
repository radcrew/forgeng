import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfile } from "@types";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

let currentUser: { user: UserProfile | null; isHydrated: boolean };
vi.mock("@contexts", () => ({
  useCurrentUser: () => currentUser,
}));

import { RoleGuard } from "@lib/auth/role-guard";

function makeUser(role: UserProfile["role"]): UserProfile {
  return { id: 1, role } as UserProfile;
}

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { user: null, isHydrated: true };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RoleGuard", () => {
  it("renders a fallback (not children) while unhydrated", () => {
    currentUser = { user: makeUser("admin"), isHydrated: false };
    render(
      <RoleGuard allowedRoles={["admin"]}>
        <div>secret</div>
      </RoleGuard>,
    );
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects a signed-out user to the sign-in path", () => {
    currentUser = { user: null, isHydrated: true };
    render(
      <RoleGuard allowedRoles={["admin"]}>
        <div>secret</div>
      </RoleGuard>,
    );
    expect(replace).toHaveBeenCalledWith("/sign-in");
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("honors a custom signInPath", () => {
    currentUser = { user: null, isHydrated: true };
    render(
      <RoleGuard allowedRoles={["admin"]} signInPath="/login">
        <div>secret</div>
      </RoleGuard>,
    );
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("bounces a wrong-role user to their home with a toast", () => {
    currentUser = { user: makeUser("student"), isHydrated: true };
    render(
      <RoleGuard allowedRoles={["admin"]}>
        <div>secret</div>
      </RoleGuard>,
    );
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/student");
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders children for an allowed role", () => {
    currentUser = { user: makeUser("admin"), isHydrated: true };
    render(
      <RoleGuard allowedRoles={["admin"]}>
        <div>secret</div>
      </RoleGuard>,
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
