import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSlackInvite = vi.fn();
vi.mock("@features/slack/api", () => ({
  getSlackInvite: (...args: unknown[]) => getSlackInvite(...args),
}));

import { JoinSlackCard } from "@features/slack/components/join-slack-card";

const LINK = "https://join.slack.com/t/forgeng/shared_invite/zt-abc123";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("JoinSlackCard", () => {
  it("links to the Slack invite in a new tab", async () => {
    getSlackInvite.mockResolvedValue({ slackInviteUrl: LINK });
    render(<JoinSlackCard />);

    const join = await screen.findByRole("link", { name: "Join Slack" });
    expect(join).toHaveAttribute("href", LINK);
    expect(join).toHaveAttribute("target", "_blank");
    expect(join).toHaveAttribute("rel", "noopener noreferrer");
  });

  it.each([
    ["no link is saved", () => getSlackInvite.mockResolvedValue({ slackInviteUrl: null })],
    [
      "the link fails to load",
      () => getSlackInvite.mockRejectedValue(new Error("network down")),
    ],
    [
      "the link is not a Slack invite",
      () =>
        getSlackInvite.mockResolvedValue({ slackInviteUrl: "javascript:alert(1)" }),
    ],
  ])("shows nothing when %s", async (_, arrange) => {
    arrange();
    const { container } = render(<JoinSlackCard />);

    await waitFor(() => expect(getSlackInvite).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
