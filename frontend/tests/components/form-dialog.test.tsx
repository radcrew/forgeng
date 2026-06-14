import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FormDialog } from "@components/common/form-dialog";

describe("FormDialog", () => {
  it("does not render its content while closed", () => {
    render(
      <FormDialog open={false} onOpenChange={vi.fn()} title="Edit cohort">
        <p>Body</p>
      </FormDialog>,
    );
    expect(screen.queryByText("Edit cohort")).not.toBeInTheDocument();
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("renders the title and children when open", () => {
    render(
      <FormDialog open onOpenChange={vi.fn()} title="Edit cohort">
        <p>Body</p>
      </FormDialog>,
    );
    expect(screen.getByText("Edit cohort")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("closes via onOpenChange when no custom onCancel is given", async () => {
    const onOpenChange = vi.fn();
    render(
      <FormDialog
        open
        onOpenChange={onOpenChange}
        title="Edit cohort"
        actions={{ onSubmit: vi.fn(), submitLabel: "Save" }}
      >
        <p>Body</p>
      </FormDialog>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("prefers a custom onCancel over onOpenChange", async () => {
    const onOpenChange = vi.fn();
    const onCancel = vi.fn();
    render(
      <FormDialog
        open
        onOpenChange={onOpenChange}
        title="Edit cohort"
        actions={{ onSubmit: vi.fn(), submitLabel: "Save", onCancel }}
      >
        <p>Body</p>
      </FormDialog>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
