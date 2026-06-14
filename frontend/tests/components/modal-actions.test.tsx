import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ModalActions } from "@components/common/modal-actions";

describe("ModalActions", () => {
  it("fires onCancel and onSubmit from their buttons", async () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    render(
      <ModalActions
        onCancel={onCancel}
        onSubmit={onSubmit}
        submitLabel="Save"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows the loading label and disables submit while loading", () => {
    render(
      <ModalActions
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        submitLabel="Save"
        isLoading
        loadingLabel="Saving..."
      />,
    );

    const submit = screen.getByRole("button", { name: "Saving..." });
    expect(submit).toBeDisabled();
  });

  it("disables submit when submitDisabled is set", () => {
    render(
      <ModalActions
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        submitLabel="Save"
        submitDisabled
      />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("uses a custom cancel label", () => {
    render(
      <ModalActions
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        submitLabel="Save"
        cancelLabel="Discard"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Discard" }),
    ).toBeInTheDocument();
  });
});
