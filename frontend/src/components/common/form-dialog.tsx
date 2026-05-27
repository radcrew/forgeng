"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

import { ModalActions, type ModalActionsProps } from "./modal-actions";

const DIALOG_SIZES = {
  sm: "sm:max-w-[480px]",
  md: "sm:max-w-[520px]",
  lg: "sm:max-w-[560px]",
} as const;

export type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  size?: keyof typeof DIALOG_SIZES;
  children: React.ReactNode;
  footer?: React.ReactNode;
  actions?: Omit<ModalActionsProps, "onCancel"> & {
    onCancel?: () => void;
  };
};

export const FormDialog = ({
  open,
  onOpenChange,
  title,
  size = "md",
  children,
  footer,
  actions,
}: FormDialogProps) => {
  const handleCancel = () => {
    if (actions?.onCancel) {
      actions.onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_SIZES[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        {(footer || actions) && (
          <DialogFooter>
            {footer ??
              (actions && (
                <ModalActions {...actions} onCancel={handleCancel} />
              ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
