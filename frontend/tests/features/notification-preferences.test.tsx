import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NotificationPreferences } from "@types";

let prefsState: {
  data: NotificationPreferences | null;
  isLoading: boolean;
  error: Error | null;
};
vi.mock("@features/notifications/hooks", () => ({
  useNotificationPreferences: () => prefsState,
}));

const updatePrefs = vi.fn();
vi.mock("@features/notifications/api", () => ({
  updateNotificationPreferences: (...args: unknown[]) => updatePrefs(...args),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

import { NotificationPreferencesCard } from "@features/notifications/components/notification-preferences";

const ALL_ON: NotificationPreferences = {
  feedbackInApp: true,
  feedbackEmail: true,
  taskInApp: true,
  taskEmail: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  updatePrefs.mockResolvedValue(undefined);
  prefsState = { data: ALL_ON, isLoading: false, error: null };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NotificationPreferencesCard", () => {
  it("renders the preference groups when loaded", () => {
    render(<NotificationPreferencesCard />);
    expect(screen.getByText("Submission feedback")).toBeInTheDocument();
    expect(screen.getByText("New tasks")).toBeInTheDocument();
  });

  it("renders switches reflecting the current preferences", () => {
    render(<NotificationPreferencesCard />);
    const switches = screen.getAllByRole("switch");
    // 2 groups x (in-app + email) = 4 switches, all on.
    expect(switches).toHaveLength(4);
    switches.forEach((s) => expect(s).toHaveAttribute("aria-checked", "true"));
  });

  it("persists a toggled-off preference with the flipped value", async () => {
    render(<NotificationPreferencesCard />);

    await userEvent.click(
      screen.getByRole("switch", {
        name: "Submission feedback in-app notifications",
      }),
    );

    expect(updatePrefs).toHaveBeenCalledWith({ feedbackInApp: false });
  });

  it("reverts and toasts when saving fails", async () => {
    updatePrefs.mockRejectedValue(new Error("network"));
    render(<NotificationPreferencesCard />);

    const toggle = screen.getByRole("switch", {
      name: "New tasks email notifications",
    });
    await userEvent.click(toggle);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    // Optimistic change is rolled back to the original "on" state.
    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"));
  });

  it("shows the skeleton while loading", () => {
    prefsState = { data: null, isLoading: true, error: null };
    render(<NotificationPreferencesCard />);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
