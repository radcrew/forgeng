import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listMeetings = vi.fn();
vi.mock("@features/meetings/api", () => ({
  listMeetings: (...args: unknown[]) => listMeetings(...args),
}));

import { MyMeetingsCard } from "@features/meetings/components/my-meetings-card";

const meeting = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  title: "Mentoring call",
  note: null,
  startsAt: "2030-11-04T15:00:00.000Z",
  endsAt: "2030-11-04T15:30:00.000Z",
  meetUrl: "https://meet.google.com/abc",
  status: "scheduled",
  host: { id: 1, name: "Grace" },
  attendee: { id: 7, name: "Ada", email: "ada@example.com" },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MyMeetingsCard", () => {
  it("lists the meetings the admin hosts", async () => {
    listMeetings.mockResolvedValue([meeting()]);
    render(<MyMeetingsCard />);

    expect(await screen.findByText(/Mentoring call/)).toBeInTheDocument();
    // No student id: the server gives an admin the meetings they host.
    expect(listMeetings).toHaveBeenCalledWith(undefined);
  });

  it("links each student to their page, where the meeting is managed", async () => {
    listMeetings.mockResolvedValue([meeting()]);
    render(<MyMeetingsCard />);

    expect(await screen.findByRole("link", { name: "Ada" })).toHaveAttribute(
      "href",
      "/admin/users/7",
    );
    expect(screen.getByRole("link", { name: /Meet link/ })).toHaveAttribute(
      "href",
      "https://meet.google.com/abc",
    );
  });

  it("names a student without a name by their email", async () => {
    listMeetings.mockResolvedValue([
      meeting({ attendee: { id: 7, name: null, email: "ada@example.com" } }),
    ]);
    render(<MyMeetingsCard />);

    expect(
      await screen.findByRole("link", { name: "ada@example.com" }),
    ).toBeInTheDocument();
  });

  it("never turns an unsafe link into a Meet link", async () => {
    listMeetings.mockResolvedValue([
      meeting({ meetUrl: "javascript:alert(1)" }),
    ]);
    render(<MyMeetingsCard />);

    await screen.findByRole("link", { name: "Ada" });
    expect(
      screen.queryByRole("link", { name: /Meet link/ }),
    ).not.toBeInTheDocument();
  });

  it("says when there are no upcoming meetings", async () => {
    listMeetings.mockResolvedValue([]);
    render(<MyMeetingsCard />);

    expect(
      await screen.findByText("No upcoming meetings."),
    ).toBeInTheDocument();
  });

  it("offers a retry when the meetings fail to load", async () => {
    listMeetings.mockRejectedValueOnce(new Error("network down"));
    render(<MyMeetingsCard />);

    await userEvent.click(
      await screen.findByRole("button", { name: /try again/i }),
    );

    expect(
      await screen.findByText("No upcoming meetings."),
    ).toBeInTheDocument();
    expect(listMeetings).toHaveBeenCalledTimes(2);
  });
});
