import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StatusTabs } from "@features/applications/components/status-tabs";
import { APPLICATION_STATUS_FILTER_TABS } from "@constants/applications";

describe("application StatusTabs", () => {
  it("renders a tab for every filter option", () => {
    render(<StatusTabs value="all" onChange={vi.fn()} />);
    for (const { label } of APPLICATION_STATUS_FILTER_TABS) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });

  it("calls onChange when another tab is selected", async () => {
    const onChange = vi.fn();
    render(<StatusTabs value="all" onChange={onChange} />);

    // Pick the second tab (not the currently-active one) to trigger a change.
    const second = APPLICATION_STATUS_FILTER_TABS[1];
    await userEvent.click(screen.getByRole("tab", { name: second.label }));

    expect(onChange).toHaveBeenCalledWith(second.value);
  });
});
