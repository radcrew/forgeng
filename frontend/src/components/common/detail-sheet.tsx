"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";

const SHEET_SIZES = {
  sm: "sm:max-w-[540px]",
  md: "sm:max-w-[580px]",
} as const;

export type DetailSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  size?: keyof typeof SHEET_SIZES;
  children: React.ReactNode;
};

export const DetailSheet = ({
  open,
  onClose,
  title,
  subtitle,
  size = "sm",
  children,
}: DetailSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={(next) => {
      if (!next) onClose();
    }}
  >
    <SheetContent
      className={`${SHEET_SIZES[size]} overflow-y-auto`}
    >
      <SheetHeader>
        <SheetTitle className="text-xl break-words">{title}</SheetTitle>
        {subtitle ? <div className="mt-1 min-w-0">{subtitle}</div> : null}
      </SheetHeader>
      <div className="mt-6 space-y-6">{children}</div>
    </SheetContent>
  </Sheet>
);
