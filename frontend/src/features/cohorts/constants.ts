import type { CohortStatus } from "./types";

export const COHORT_STATUS_VARIANT: Record<
  CohortStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  draft: "secondary",
  completed: "outline",
};
