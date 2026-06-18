import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { VerdictPicker } from "@components/common/verdict-picker";

describe("VerdictPicker", () => {
  it("calls onChange with 'approved' when Approve is clicked", async () => {
    const onChange = vi.fn();
    render(<VerdictPicker value="needs_work" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /approve/i }));

    expect(onChange).toHaveBeenCalledWith("approved");
  });

  it("calls onChange with 'needs_work' when Needs Work is clicked", async () => {
    const onChange = vi.fn();
    render(<VerdictPicker value="approved" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /needs work/i }));

    expect(onChange).toHaveBeenCalledWith("needs_work");
  });

  it("renders both verdict options", () => {
    render(<VerdictPicker value="approved" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /needs work/i }),
    ).toBeInTheDocument();
  });
});
