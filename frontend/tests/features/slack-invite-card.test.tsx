import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSlackInvite = vi.fn();
const updateSlackInvite = vi.fn();
vi.mock("@features/slack/api", () => ({
  getSlackInvite: (...args: unknown[]) => getSlackInvite(...args),
  updateSlackInvite: (...args: unknown[]) => updateSlackInvite(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import { SlackInviteCard } from "@features/slack/components/slack-invite-card";
import { ApiError } from "@lib/api-client";

const LINK = "https://join.slack.com/t/forgeng/shared_invite/zt-abc123";

beforeEach(() => {
  vi.clearAllMocks();
  getSlackInvite.mockResolvedValue({ slackInviteUrl: null });
  updateSlackInvite.mockImplementation((slackInviteUrl: string | null) =>
    Promise.resolve({ slackInviteUrl }),
  );
});

const linkInput = () => screen.findByLabelText("Slack invite link");

describe("SlackInviteCard", () => {
  it("shows the saved link", async () => {
    getSlackInvite.mockResolvedValue({ slackInviteUrl: LINK });
    render(<SlackInviteCard />);

    expect(await linkInput()).toHaveValue(LINK);
    expect(
      screen.getByRole("button", { name: "Remove link" }),
    ).toBeInTheDocument();
  });

  it("saves a trimmed Slack invite link", async () => {
    render(<SlackInviteCard />);

    await userEvent.type(await linkInput(), `  ${LINK} `);
    await userEvent.click(screen.getByRole("button", { name: "Save link" }));

    expect(updateSlackInvite).toHaveBeenCalledWith(LINK);
    expect(toastSuccess).toHaveBeenCalledWith("Slack invite link saved.");
  });

  it("refuses a link that is not a Slack invite", async () => {
    render(<SlackInviteCard />);

    await userEvent.type(await linkInput(), "https://evil.example.com/join");
    await userEvent.click(screen.getByRole("button", { name: "Save link" }));

    expect(screen.getByText(/Use a Slack invite link/)).toBeInTheDocument();
    expect(updateSlackInvite).not.toHaveBeenCalled();
  });

  it("asks for a link before saving", async () => {
    render(<SlackInviteCard />);

    await linkInput();
    await userEvent.click(screen.getByRole("button", { name: "Save link" }));

    expect(
      screen.getByText("Paste the Slack invite link first."),
    ).toBeInTheDocument();
    expect(updateSlackInvite).not.toHaveBeenCalled();
  });

  it("removes the saved link", async () => {
    getSlackInvite.mockResolvedValue({ slackInviteUrl: LINK });
    render(<SlackInviteCard />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Remove link" }),
    );

    expect(updateSlackInvite).toHaveBeenCalledWith(null);
    expect(toastSuccess).toHaveBeenCalledWith("Slack invite link removed.");
  });

  it("shows the server's message when saving fails", async () => {
    updateSlackInvite.mockRejectedValue(
      new ApiError(500, "Something went wrong on the server."),
    );
    render(<SlackInviteCard />);

    await userEvent.type(await linkInput(), LINK);
    await userEvent.click(screen.getByRole("button", { name: "Save link" }));

    expect(toastError).toHaveBeenCalledWith(
      "Something went wrong on the server.",
    );
  });

  it("offers a retry when the link fails to load", async () => {
    getSlackInvite.mockRejectedValueOnce(new Error("network down"));
    render(<SlackInviteCard />);

    await userEvent.click(
      await screen.findByRole("button", { name: /try again/i }),
    );

    expect(await linkInput()).toBeInTheDocument();
    expect(getSlackInvite).toHaveBeenCalledTimes(2);
  });
});
