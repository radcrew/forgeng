import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createCohort = vi.fn();
const updateCohort = vi.fn();
vi.mock("@features/cohorts/api", () => ({
  createCohort: (...args: unknown[]) => createCohort(...args),
  updateCohort: (...args: unknown[]) => updateCohort(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import type { Cohort } from "@types";
import { CohortFormDialog as FormDialog } from "@features/cohorts/components/form-dialog";

function makeCohort(overrides: Partial<Cohort> = {}): Cohort {
  return {
    id: 3,
    name: "Spring 2026",
    description: null,
    capacity: 30,
    enrolledCount: 0,
    status: "draft",
    startDate: null,
    endDate: null,
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  } as Cohort;
}

beforeEach(() => {
  vi.clearAllMocks();
  createCohort.mockResolvedValue(undefined);
  updateCohort.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cohort FormDialog", () => {
  it("disables create submit until a name is entered", async () => {
    render(<FormDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Create Cohort")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();

    await userEvent.type(
      screen.getByPlaceholderText(/Spring 2026/i),
      "Summer",
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("creates a cohort with the default capacity and entered name", async () => {
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <FormDialog open onOpenChange={onOpenChange} onSaved={onSaved} />,
    );

    await userEvent.type(screen.getByPlaceholderText(/Spring 2026/i), "Summer");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(createCohort).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Summer", capacity: 20, status: "draft" }),
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("edits an existing cohort via updateCohort", async () => {
    render(<FormDialog cohort={makeCohort()} open onOpenChange={vi.fn()} />);

    expect(screen.getByText("Edit Cohort")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(updateCohort).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ name: "Spring 2026", capacity: 30 }),
    );
  });

  it("saves a trimmed Slack channel ID", async () => {
    render(<FormDialog cohort={makeCohort()} open onOpenChange={vi.fn()} />);

    await userEvent.type(
      screen.getByLabelText("Slack channel ID (optional)"),
      " C0123ABCD ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(updateCohort).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ slackChannelId: "C0123ABCD" }),
    );
  });

  it("removes the Slack channel when the field is cleared", async () => {
    render(
      <FormDialog
        cohort={makeCohort({ slackChannelId: "C0123ABCD" })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    const field = screen.getByLabelText("Slack channel ID (optional)");
    expect(field).toHaveValue("C0123ABCD");
    await userEvent.clear(field);
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    // It asks first, because the students are taken out of the channel.
    expect(updateCohort).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Remove the Slack channel?"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Remove channel" }),
    );

    await waitFor(() =>
      expect(updateCohort).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ slackChannelId: null }),
      ),
    );
  });

  it("keeps the Slack channel when removing it is cancelled", async () => {
    render(
      <FormDialog
        cohort={makeCohort({ slackChannelId: "C0123ABCD" })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await userEvent.clear(screen.getByLabelText("Slack channel ID (optional)"));
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    const confirm = await screen.findByRole("dialog", {
      name: "Remove the Slack channel?",
    });
    await userEvent.click(
      Array.from(confirm.querySelectorAll("button")).find(
        (b) => b.textContent === "Cancel",
      )!,
    );

    await waitFor(() =>
      expect(
        screen.queryByText("Remove the Slack channel?"),
      ).not.toBeInTheDocument(),
    );
    expect(updateCohort).not.toHaveBeenCalled();
  });

  it("moves to another channel without asking", async () => {
    render(
      <FormDialog
        cohort={makeCohort({ slackChannelId: "C0123ABCD" })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    const field = screen.getByLabelText("Slack channel ID (optional)");
    await userEvent.clear(field);
    await userEvent.type(field, "C0999WXYZ");
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(updateCohort).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ slackChannelId: "C0999WXYZ" }),
    );
  });

  it("leaves the Slack channel out when the field was not changed", async () => {
    // The page was loaded before the background channel was saved.
    render(<FormDialog cohort={makeCohort()} open onOpenChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    const [, payload] = updateCohort.mock.calls[0] as [number, object];
    expect(payload).not.toHaveProperty("slackChannelId");
  });

  it("refuses a channel name instead of a channel ID", async () => {
    render(<FormDialog cohort={makeCohort()} open onOpenChange={vi.fn()} />);

    await userEvent.type(
      screen.getByLabelText("Slack channel ID (optional)"),
      "#spring-cohort",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      screen.getByText(/Use the channel ID, for example C0123ABCD/),
    ).toBeInTheDocument();
    expect(updateCohort).not.toHaveBeenCalled();
  });

  it("explains that an empty channel ID creates a channel, only when creating", () => {
    const { unmount } = render(<FormDialog open onOpenChange={vi.fn()} />);
    expect(
      screen.getByText(/Leave it empty to create a private Slack channel/),
    ).toBeInTheDocument();
    unmount();

    render(<FormDialog cohort={makeCohort()} open onOpenChange={vi.fn()} />);
    expect(
      screen.queryByText(/Leave it empty to create a private Slack channel/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/New tasks are posted to this channel/),
    ).toBeInTheDocument();
  });

  it("keeps create disabled for a name that is only spaces", async () => {
    render(<FormDialog open onOpenChange={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/Spring 2026/i), "   ");

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("shows an error and does not save an empty capacity", async () => {
    render(<FormDialog open onOpenChange={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/Spring 2026/i), "Summer");
    await userEvent.clear(screen.getByLabelText("Capacity"));
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      screen.getByText("Enter a whole number of 1 or more."),
    ).toBeInTheDocument();
    expect(createCohort).not.toHaveBeenCalled();
  });

  it("does not save a capacity below the enrolled count", async () => {
    render(
      <FormDialog
        cohort={makeCohort({ enrolledCount: 5 })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    const capacity = screen.getByLabelText("Capacity");
    await userEvent.clear(capacity);
    await userEvent.type(capacity, "4");
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByText(/5 students are already enrolled/)).toBeInTheDocument();
    expect(updateCohort).not.toHaveBeenCalled();
  });

  it("does not save an end date before the start date", async () => {
    render(
      <FormDialog
        cohort={makeCohort({
          startDate: "2026-05-01T00:00:00.000Z",
          endDate: "2026-02-01T00:00:00.000Z",
        })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      screen.getByText("The end date must be on or after the start date."),
    ).toBeInTheDocument();
    expect(updateCohort).not.toHaveBeenCalled();
  });

  it("toasts an error when the create fails", async () => {
    createCohort.mockRejectedValue(new Error("nope"));
    render(<FormDialog open onOpenChange={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/Spring 2026/i), "Summer");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
