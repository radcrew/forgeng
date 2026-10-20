import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listMeetings = vi.fn();
vi.mock("@features/meetings/api", () => ({
  listMeetings: (...args: unknown[]) => listMeetings(...args),
}));

import { UpcomingMeetingsCard } from "@features/meetings/components/upcoming-meetings-card";

const meeting = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  title: "Mentoring call",
  note: "Bring your CLI project",
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

describe("UpcomingMeetingsCard", () => {
  it("loads the student's own meetings", async () => {
    listMeetings.mockResolvedValue([meeting()]);
    render(<UpcomingMeetingsCard />);

    expect(await screen.findByText("Mentoring call")).toBeInTheDocument();
    // No student id: the server only gives a student their own meetings.
    expect(listMeetings).toHaveBeenCalledWith(undefined);
    expect(screen.getByText(/· with Grace$/)).toBeInTheDocument();
    expect(screen.getByText("Bring your CLI project")).toBeInTheDocument();
  });

  it("opens the call in a new tab", async () => {
    listMeetings.mockResolvedValue([meeting()]);
    render(<UpcomingMeetingsCard />);

    const join = await screen.findByRole("link", {
      name: "Join Mentoring call",
    });
    expect(join).toHaveAttribute("href", "https://meet.google.com/abc");
    expect(join).toHaveAttribute("target", "_blank");
    expect(join).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("never turns an unsafe link into a Join button", async () => {
    listMeetings.mockResolvedValue([
      meeting({ meetUrl: "javascript:alert(1)" }),
    ]);
    render(<UpcomingMeetingsCard />);

    await screen.findByText("Mentoring call");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("calls a mentor without a name 'your mentor'", async () => {
    listMeetings.mockResolvedValue([meeting({ host: { id: 1, name: null } })]);
    render(<UpcomingMeetingsCard />);

    expect(await screen.findByText(/· with your mentor$/)).toBeInTheDocument();
  });

  it.each([
    ["there are no meetings", () => listMeetings.mockResolvedValue([])],
    [
      "the meetings fail to load",
      () => listMeetings.mockRejectedValue(new Error("network down")),
    ],
  ])("shows nothing when %s", async (_, arrange) => {
    arrange();
    const { container } = render(<UpcomingMeetingsCard />);

    await waitFor(() => expect(listMeetings).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
