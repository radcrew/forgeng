import { Badge } from "@components/ui/badge";
import { cn } from "@lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type StatusBadgeProps<T extends string> = {
  status: T;
  variantMap: Record<T, BadgeVariant>;
  label?: string;
  className?: string;
  leadingIcon?: React.ReactNode;
};

export const StatusBadge = <T extends string>({
  status,
  variantMap,
  label,
  className,
  leadingIcon,
}: StatusBadgeProps<T>) => (
  <Badge variant={variantMap[status]} className={cn("capitalize", className)}>
    {leadingIcon}
    {label ?? String(status).replace(/_/g, " ")}
  </Badge>
);
