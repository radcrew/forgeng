import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMyBookingUrl = vi.fn();
const updateMyBookingUrl = vi.fn();
vi.mock("@features/mentors/api", () => ({
  getMyBookingUrl: (...args: unknown[]) => getMyBookingUrl(...args),
  updateMyBookingUrl: (...args: unknown[]) => updateMyBookingUrl(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import { BookingUrlCard } from "@features/mentors/components/booking-url-card";
import { ApiError } from "@lib/api-client";

const LINK = "https://calendar.app.google/AbCd1234";

beforeEach(() => {
  vi.clearAllMocks();
  getMyBookingUrl.mockResolvedValue({ bookingUrl: null });
  updateMyBookingUrl.mockImplementation((bookingUrl: string | null) =>
    Promise.resolve({ bookingUrl }),
  );
});

const linkInput = () => screen.findByLabelText("Booking page link");

describe("BookingUrlCard", () => {
  it("shows the saved link", async () => {
    getMyBookingUrl.mockResolvedValue({ bookingUrl: LINK });
    render(<BookingUrlCard />);

    expect(await linkInput()).toHaveValue(LINK);
    expect(
      screen.getByRole("button", { name: "Remove link" }),
    ).toBeInTheDocument();
  });

  it("saves a trimmed Google booking page link", async () => {
    render(<BookingUrlCard />);

    await userEvent.type(await linkInput(), `  ${LINK} `);
    await userEvent.click(screen.getByRole("button", { name: "Save link" }));

    expect(updateMyBookingUrl).toHaveBeenCalledWith(LINK);
    expect(toastSuccess).toHaveBeenCalledWith("Booking page saved.");
  });

  it("refuses a link that is not a Google booking page", async () => {
    render(<BookingUrlCard />);

    await userEvent.type(await linkInput(), "https://evil.example.com/book");
    await userEvent.click(screen.getByRole("button", { name: "Save link" }));

    expect(
      screen.getByText(/Use a Google Calendar booking page link/),
    ).toBeInTheDocument();
    expect(updateMyBookingUrl).not.toHaveBeenCalled();
  });

  it("asks for a link before saving", async () => {
    render(<BookingUrlCard />);

    await linkInput();
    await userEvent.click(screen.getByRole("button", { name: "Save link" }));

    expect(
      screen.getByText("Paste your booking page link first."),
    ).toBeInTheDocument();
    expect(updateMyBookingUrl).not.toHaveBeenCalled();
  });

  it("removes the saved link", async () => {
    getMyBookingUrl.mockResolvedValue({ bookingUrl: LINK });
    render(<BookingUrlCard />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Remove link" }),
    );

    expect(updateMyBookingUrl).toHaveBeenCalledWith(null);
    expect(toastSuccess).toHaveBeenCalledWith("Booking page removed.");
  });

  it("shows the server's message when saving fails", async () => {
    updateMyBookingUrl.mockRejectedValue(
      new ApiError(500, "Something went wrong on the server."),
    );
    render(<BookingUrlCard />);

    await userEvent.type(await linkInput(), LINK);
    await userEvent.click(screen.getByRole("button", { name: "Save link" }));

    expect(toastError).toHaveBeenCalledWith(
      "Something went wrong on the server.",
    );
  });

  it("offers a retry when the link fails to load", async () => {
    getMyBookingUrl.mockRejectedValueOnce(new Error("network down"));
    render(<BookingUrlCard />);

    await userEvent.click(
      await screen.findByRole("button", { name: /try again/i }),
    );

    expect(await linkInput()).toBeInTheDocument();
    expect(getMyBookingUrl).toHaveBeenCalledTimes(2);
  });
});
