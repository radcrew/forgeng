import type { ApplicationStatus } from "@lib/types";

export const APPLICATION_STATUS_VARIANT: Record<
  ApplicationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  reviewing: "outline",
  accepted: "default",
  rejected: "destructive",
};
