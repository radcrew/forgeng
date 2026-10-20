import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Their own tests cover them. Here they only stand in.
vi.mock("@features/meetings", () => ({
  MyMeetingsCard: () => <div>Your upcoming meetings</div>,
  GoogleCalendarCard: () => <div>Google Calendar</div>,
}));
vi.mock("@features/mentors", () => ({
  BookingUrlCard: () => <div>Your booking page</div>,
}));

import Page from "../../src/app/admin/meetings/page";

describe("admin meetings page", () => {
  it("holds the meetings, the Google Calendar connection, and the booking page", () => {
    render(<Page />);

    expect(
      screen.getByRole("heading", { name: "Meetings" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Your upcoming meetings")).toBeInTheDocument();
    expect(screen.getByText("Google Calendar")).toBeInTheDocument();
    expect(screen.getByText("Your booking page")).toBeInTheDocument();
  });
});
