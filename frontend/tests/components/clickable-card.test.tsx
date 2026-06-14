import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ClickableCard } from "@components/common/clickable-card";

describe("ClickableCard", () => {
  it("renders its children", () => {
    render(
      <ClickableCard onClick={vi.fn()}>
        <span>Cohort details</span>
      </ClickableCard>,
    );
    expect(screen.getByText("Cohort details")).toBeInTheDocument();
  });

  it("fires onClick when the card is clicked", async () => {
    const onClick = vi.fn();
    render(
      <ClickableCard onClick={onClick}>
        <span>Open</span>
      </ClickableCard>,
    );

    await userEvent.click(screen.getByText("Open"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
