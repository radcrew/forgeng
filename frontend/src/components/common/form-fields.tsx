"use client";

import { Label } from "@components/ui/label";
import { cn } from "@utils";

export type FormFieldProps = {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
};

export const FormField = ({
  label,
  htmlFor,
  children,
  className,
}: FormFieldProps) => (
  <div className={cn("space-y-2", className)}>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
  </div>
);

export const FormBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("space-y-4 py-2", className)}>{children}</div>;

export const FormGrid = ({
  children,
  columns = 2,
}: {
  children: React.ReactNode;
  columns?: 1 | 2;
}) => (
  <div
    className={cn(
      "gap-4",
      columns === 2 ? "grid grid-cols-2" : "space-y-4",
    )}
  >
    {children}
  </div>
);
