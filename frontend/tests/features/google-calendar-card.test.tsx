import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getGoogleCalendarStatus = vi.fn();
const disconnectGoogleCalendar = vi.fn();
vi.mock("@features/meetings/api", () => ({
  getGoogleCalendarStatus: (...args: unknown[]) =>
    getGoogleCalendarStatus(...args),
  disconnectGoogleCalendar: (...args: unknown[]) =>
    disconnectGoogleCalendar(...args),
  googleCalendarConnectUrl: () =>
    "http://api.test/api/integrations/google-calendar/connect",
}));

let search = "";
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/meetings",
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import { GoogleCalendarCard } from "@features/meetings/components/google-calendar-card";

const status = (overrides: Record<string, unknown> = {}) => ({
  configured: true,
  connected: false,
  googleEmail: null,
  broken: false,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  search = "";
  getGoogleCalendarStatus.mockResolvedValue(status());
  disconnectGoogleCalendar.mockResolvedValue(undefined);
});

describe("GoogleCalendarCard", () => {
  it("links to the connect page when not connected", async () => {
    render(<GoogleCalendarCard />);

    const link = await screen.findByRole("link", {
      name: "Connect Google Calendar",
    });
    expect(link).toHaveAttribute(
      "href",
      "http://api.test/api/integrations/google-calendar/connect",
    );
  });

  it("explains when the server has no Google Calendar settings", async () => {
    getGoogleCalendarStatus.mockResolvedValue(status({ configured: false }));
    render(<GoogleCalendarCard />);

    expect(
      await screen.findByText(/not set up on this server yet/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the connected Google account", async () => {
    getGoogleCalendarStatus.mockResolvedValue(
      status({ connected: true, googleEmail: "mentor@gmail.com" }),
    );
    render(<GoogleCalendarCard />);

    expect(await screen.findByText("mentor@gmail.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("asks to connect again when the connection is broken", async () => {
    getGoogleCalendarStatus.mockResolvedValue(
      status({ connected: true, googleEmail: "mentor@gmail.com", broken: true }),
    );
    render(<GoogleCalendarCard />);

    expect(
      await screen.findByText(/Google stopped accepting/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Connect again" }),
    ).toBeInTheDocument();
  });

  it("disconnects only after confirming", async () => {
    getGoogleCalendarStatus.mockResolvedValue(
      status({ connected: true, googleEmail: "mentor@gmail.com" }),
    );
    render(<GoogleCalendarCard />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Disconnect" }),
    );
    expect(disconnectGoogleCalendar).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      Array.from(dialog.querySelectorAll("button")).find(
        (b) => b.textContent === "Disconnect",
      )!,
    );

    await waitFor(() => expect(disconnectGoogleCalendar).toHaveBeenCalled());
    expect(toastSuccess).toHaveBeenCalledWith("Google Calendar disconnected.");
  });

  it("offers a retry when the status fails to load", async () => {
    getGoogleCalendarStatus.mockRejectedValueOnce(new Error("network down"));
    render(<GoogleCalendarCard />);

    await userEvent.click(
      await screen.findByRole("button", { name: /try again/i }),
    );

    expect(
      await screen.findByRole("link", { name: "Connect Google Calendar" }),
    ).toBeInTheDocument();
  });

  describe("the result from Google's page", () => {
    it("says it worked, then removes it from the address", async () => {
      search = "googleCalendar=connected";
      render(<GoogleCalendarCard />);

      await waitFor(() =>
        expect(toastSuccess).toHaveBeenCalledWith("Google Calendar connected."),
      );
      expect(replace).toHaveBeenCalledWith("/admin/meetings");
      // Once, even though the mocked address never changes.
      await screen.findByRole("link", { name: "Connect Google Calendar" });
      expect(toastSuccess).toHaveBeenCalledTimes(1);
    });

    it("explains an unticked calendar box", async () => {
      search = "googleCalendar=scope";
      render(<GoogleCalendarCard />);

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith(
          expect.stringMatching(/leave that box ticked/),
        ),
      );
    });

    it("shows a general message for an unknown result", async () => {
      search = "googleCalendar=something-new";
      render(<GoogleCalendarCard />);

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith(
          "Google didn't finish the connection. Please try again.",
        ),
      );
    });

    it("shows nothing without a result", async () => {
      render(<GoogleCalendarCard />);

      await screen.findByRole("link", { name: "Connect Google Calendar" });
      expect(toastSuccess).not.toHaveBeenCalled();
      expect(toastError).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    });
  });
});
