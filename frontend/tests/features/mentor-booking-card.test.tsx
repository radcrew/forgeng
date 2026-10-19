import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listMentors = vi.fn();
vi.mock("@features/mentors/api", () => ({
  listMentors: (...args: unknown[]) => listMentors(...args),
}));

import { MentorBookingCard } from "@features/mentors/components/mentor-booking-card";

const GRACE = {
  id: 1,
  name: "Grace Hopper",
  avatarUrl: null,
  bookingUrl: "https://calendar.app.google/grace",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MentorBookingCard", () => {
  it("links to each mentor's booking page in a new tab", async () => {
    listMentors.mockResolvedValue([GRACE]);
    render(<MentorBookingCard />);

    const link = await screen.findByRole("link", {
      name: "Book a meeting with Grace Hopper",
    });
    expect(link).toHaveAttribute("href", GRACE.bookingUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("names a mentor without a name 'Mentor'", async () => {
    listMentors.mockResolvedValue([{ ...GRACE, name: null }]);
    render(<MentorBookingCard />);

    expect(
      await screen.findByRole("link", { name: "Book a meeting with Mentor" }),
    ).toBeInTheDocument();
  });

  it("shows nothing when no mentor has a booking page", async () => {
    listMentors.mockResolvedValue([]);
    const { container } = render(<MentorBookingCard />);

    await waitFor(() => expect(listMentors).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing when the mentors fail to load", async () => {
    listMentors.mockRejectedValue(new Error("network down"));
    const { container } = render(<MentorBookingCard />);

    await waitFor(() => expect(listMentors).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("never links to a page that is not a Google booking page", async () => {
    listMentors.mockResolvedValue([
      { ...GRACE, id: 2, bookingUrl: "javascript:alert(1)" },
    ]);
    const { container } = render(<MentorBookingCard />);

    await waitFor(() => expect(listMentors).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
