import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const update = vi.fn();
vi.mock("@features/applications/hooks", () => ({
  useUpdateApplicationStatus: () => ({ update, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ApplicationReviewPanel } from "@features/applications/components/application-review-panel";

beforeEach(() => {
  vi.clearAllMocks();
  update.mockResolvedValue(undefined);
});

describe("ApplicationReviewPanel", () => {
  it.each(["accepted", "rejected"] as const)(
    "locks the status of a %s application",
    (status) => {
      render(
        <ApplicationReviewPanel
          applicationId={10}
          initialStatus={status}
          initialNote=""
        />,
      );

      expect(screen.getByRole("combobox", { name: "Status" })).toBeDisabled();
      expect(screen.getByText(/its status can't be changed/)).toBeInTheDocument();
    },
  );

  it("still saves the note on a decided application", async () => {
    render(
      <ApplicationReviewPanel
        applicationId={10}
        initialStatus="rejected"
        initialNote=""
      />,
    );

    await userEvent.type(screen.getByPlaceholderText(/Internal notes/), "Late");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(update).toHaveBeenCalledWith(10, {
      status: "rejected",
      reviewerNote: "Late",
    });
  });

  it("leaves the status open on a pending application", () => {
    render(
      <ApplicationReviewPanel
        applicationId={10}
        initialStatus="pending"
        initialNote=""
      />,
    );

    expect(screen.getByRole("combobox", { name: "Status" })).toBeEnabled();
  });
});
