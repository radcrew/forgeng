import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfile } from "@types";

let unread: { count: number; setCount: () => void; refresh: () => void };
vi.mock("@features/notifications/hooks", () => ({
  useUnreadNotificationCount: () => unread,
  useNotifications: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

let currentUser: { user: UserProfile | null };
vi.mock("@contexts", () => ({
  useCurrentUser: () => currentUser,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { NotificationBell } from "@features/notifications/components/notification-bell";

beforeEach(() => {
  unread = { count: 0, setCount: vi.fn(), refresh: vi.fn() };
  currentUser = { user: { id: 1, role: "student" } as UserProfile };
});

describe("NotificationBell", () => {
  it("shows no unread badge and a plain label at zero", () => {
    render(<NotificationBell />);
    expect(
      screen.getByRole("button", { name: "Notifications" }),
    ).toBeInTheDocument();
  });

  it("shows the unread count and an annotated label", () => {
    unread = { ...unread, count: 5 };
    render(<NotificationBell />);
    expect(
      screen.getByRole("button", { name: "Notifications, 5 unread" }),
    ).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("caps the badge at 99+", () => {
    unread = { ...unread, count: 150 };
    render(<NotificationBell />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});
