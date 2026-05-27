"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

const DIALOG_SIZES = {
  sm: "sm:max-w-[480px]",
  md: "sm:max-w-[520px]",
  lg: "sm:max-w-[560px]",
} as const;

export type ContentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  size?: keyof typeof DIALOG_SIZES;
  children: React.ReactNode;
};

/** Dialog for read-only or custom-footed content (no default submit/cancel). */
export const ContentDialog = ({
  open,
  onOpenChange,
  title,
  size = "sm",
  children,
}: ContentDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={DIALOG_SIZES[size]}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>
);
