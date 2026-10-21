import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listMeetings = vi.fn();
const scheduleMeeting = vi.fn();
const rescheduleMeeting = vi.fn();
const cancelMeeting = vi.fn();
const getGoogleCalendarStatus = vi.fn();
vi.mock("@features/meetings/api", () => ({
  listMeetings: (...args: unknown[]) => listMeetings(...args),
  scheduleMeeting: (...args: unknown[]) => scheduleMeeting(...args),
  rescheduleMeeting: (...args: unknown[]) => rescheduleMeeting(...args),
  cancelMeeting: (...args: unknown[]) => cancelMeeting(...args),
  getGoogleCalendarStatus: (...args: unknown[]) =>
    getGoogleCalendarStatus(...args),
}));

vi.mock("@contexts", () => ({
  useCurrentUser: () => ({ user: { id: 1 } }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import { StudentMeetings } from "@features/meetings/components/student-meetings";
import { toDateInput } from "@features/meetings/time";

const tomorrow = () => toDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000));

const meeting = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  title: "Mentoring call",
  note: "Bring your CLI",
  startsAt: "2030-11-04T15:00:00.000Z",
  endsAt: "2030-11-04T15:30:00.000Z",
  meetUrl: "https://meet.google.com/abc",
  status: "scheduled",
  host: { id: 1, name: "Grace" },
  attendee: { id: 7, name: "Ada", email: "ada@example.com" },
  ...overrides,
});

const connected = { configured: true, connected: true, googleEmail: "g@x", broken: false };

beforeEach(() => {
  vi.clearAllMocks();
  listMeetings.mockResolvedValue([]);
  getGoogleCalendarStatus.mockResolvedValue(connected);
  scheduleMeeting.mockResolvedValue(meeting());
  rescheduleMeeting.mockResolvedValue(meeting());
  cancelMeeting.mockResolvedValue(meeting({ status: "cancelled" }));
});

const renderSection = () =>
  render(<StudentMeetings studentId={7} studentName="Ada" />);

describe("StudentMeetings", () => {
  it("loads the meetings with this student", async () => {
    renderSection();

    expect(await screen.findByText("No upcoming meetings.")).toBeInTheDocument();
    expect(listMeetings).toHaveBeenCalledWith(7);
  });

  it("lets the host move or cancel only their own meetings", async () => {
    listMeetings.mockResolvedValue([
      meeting(),
      meeting({ id: 6, title: "Code review", host: { id: 2, name: "Linus" } }),
    ]);
    renderSection();

    expect(await screen.findByText("Code review")).toBeInTheDocument();
    expect(screen.getByText(/· You$/)).toBeInTheDocument();
    expect(screen.getByText(/· Linus$/)).toBeInTheDocument();
    // Only one meeting is the signed-in admin's own.
    expect(screen.getAllByRole("button", { name: "Reschedule" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /Meet link/ })[0]).toHaveAttribute(
      "href",
      "https://meet.google.com/abc",
    );
  });

  it("offers a retry when the meetings fail to load", async () => {
    listMeetings.mockRejectedValueOnce(new Error("network down"));
    renderSection();

    await userEvent.click(
      await screen.findByRole("button", { name: /try again/i }),
    );

    expect(await screen.findByText("No upcoming meetings.")).toBeInTheDocument();
  });

  it("points to the Meetings page when the admin's calendar isn't connected", async () => {
    getGoogleCalendarStatus.mockResolvedValue({ ...connected, connected: false });
    renderSection();

    expect(
      await screen.findByRole("link", { name: "Open Meetings" }),
    ).toHaveAttribute("href", "/admin/meetings");
    expect(
      screen.queryByRole("button", { name: "Schedule a meeting" }),
    ).not.toBeInTheDocument();
  });

  it("explains when the server has no Google Calendar settings", async () => {
    getGoogleCalendarStatus.mockResolvedValue({
      ...connected,
      configured: false,
      connected: false,
    });
    renderSection();

    expect(
      await screen.findByText(/not set up on this server/),
    ).toBeInTheDocument();
  });

  it("schedules a meeting at the picked local time", async () => {
    renderSection();

    await userEvent.click(
      await screen.findByRole("button", { name: "Schedule a meeting" }),
    );
    const date = tomorrow();
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: date } });
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "15:00" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Schedule meeting" }),
    );

    await waitFor(() =>
      expect(scheduleMeeting).toHaveBeenCalledWith({
        attendeeId: 7,
        title: "Mentoring call",
        note: null,
        startsAt: new Date(`${date}T15:00`).toISOString(),
        durationMinutes: 30,
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith(
      "Meeting scheduled. Google emailed Ada the invite.",
    );
    // The list loads again with the new meeting.
    expect(listMeetings).toHaveBeenCalledTimes(2);
  });

  it("refuses a time in the past without asking the server", async () => {
    renderSection();

    await userEvent.click(
      await screen.findByRole("button", { name: "Schedule a meeting" }),
    );
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2020-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "10:00" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Schedule meeting" }),
    );

    expect(screen.getByText("Pick a time in the future.")).toBeInTheDocument();
    expect(scheduleMeeting).not.toHaveBeenCalled();
  });

  it("shows the server's message when scheduling fails", async () => {
    const { ApiError } = await import("@lib/api-client");
    scheduleMeeting.mockRejectedValue(
      new ApiError(409, "Connect your Google Calendar first."),
    );
    renderSection();

    await userEvent.click(
      await screen.findByRole("button", { name: "Schedule a meeting" }),
    );
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: tomorrow() },
    });
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "15:00" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Schedule meeting" }),
    );

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Connect your Google Calendar first.",
      ),
    );
  });

  it("fills the form with the meeting when rescheduling", async () => {
    listMeetings.mockResolvedValue([meeting()]);
    renderSection();

    await userEvent.click(
      await screen.findByRole("button", { name: "Reschedule" }),
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Mentoring call");
    expect(screen.getByLabelText("Note (optional)")).toHaveValue(
      "Bring your CLI",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(rescheduleMeeting).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          startsAt: "2030-11-04T15:00:00.000Z",
          durationMinutes: 30,
        }),
      ),
    );
  });

  it("saves a meeting that has started when its start time is kept", async () => {
    // Started 10 minutes ago, on a whole minute, as the form keeps minutes.
    const startsAt = new Date(Date.now() - 10 * 60 * 1000);
    startsAt.setSeconds(0, 0);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    listMeetings.mockResolvedValue([
      meeting({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      }),
    ]);
    renderSection();

    await userEvent.click(
      await screen.findByRole("button", { name: "Reschedule" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(rescheduleMeeting).toHaveBeenCalled());
    expect(
      screen.queryByText("Pick a time in the future."),
    ).not.toBeInTheDocument();
  });

  it("cancels a meeting only after confirming", async () => {
    listMeetings.mockResolvedValue([meeting()]);
    renderSection();

    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(cancelMeeting).not.toHaveBeenCalled();
    await userEvent.click(
      await screen.findByRole("button", { name: "Cancel meeting" }),
    );

    await waitFor(() => expect(cancelMeeting).toHaveBeenCalledWith(5));
    expect(toastSuccess).toHaveBeenCalledWith(
      "Meeting cancelled. Google emailed Ada.",
    );
  });
});
