"use client";

import { Button } from "@components/ui/button";
import type { ComponentProps } from "react";

export type ModalActionsProps = {
  onCancel: () => void;
  cancelLabel?: string;
  onSubmit: () => void;
  submitLabel: string;
  isLoading?: boolean;
  loadingLabel?: string;
  submitDisabled?: boolean;
  submitVariant?: ComponentProps<typeof Button>["variant"];
};

export const ModalActions = ({
  onCancel,
  cancelLabel = "Cancel",
  onSubmit,
  submitLabel,
  isLoading = false,
  loadingLabel = "Saving...",
  submitDisabled = false,
  submitVariant = "default",
}: ModalActionsProps) => (
  <>
    <Button type="button" variant="outline" onClick={onCancel}>
      {cancelLabel}
    </Button>
    <Button
      type="button"
      variant={submitVariant}
      onClick={onSubmit}
      disabled={submitDisabled || isLoading}
    >
      {isLoading ? loadingLabel : submitLabel}
    </Button>
  </>
);
