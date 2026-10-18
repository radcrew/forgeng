import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "@components/shared/error-state";

describe("ErrorState", () => {
  it("says what failed to load", () => {
    render(<ErrorState what="your tasks" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't load your tasks.",
    );
  });

  it("shows a custom message in place of the default sentence", () => {
    render(
      <ErrorState what="the tasks" message="We couldn't refresh the tasks." />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /^We couldn't refresh the tasks\.$/,
    );
  });

  it("loads again when Try again is clicked", async () => {
    const onRetry = vi.fn();
    render(<ErrorState what="your tasks" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
