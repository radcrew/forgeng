import type { ApplicationStatus } from "@types";

export const APPLICATION_STATUS_VARIANT: Record<
  ApplicationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
};
