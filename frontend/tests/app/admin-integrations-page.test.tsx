import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@features/slack", () => ({
  SlackInviteCard: () => <div>Slack community card</div>,
}));

import Page from "../../src/app/admin/integrations/page";

describe("admin Integrations page", () => {
  it("shows the Slack card under the Integrations heading", () => {
    render(<Page />);

    expect(
      screen.getByRole("heading", { name: "Integrations" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Slack community card")).toBeInTheDocument();
  });
});
