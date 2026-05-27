import type { SubmissionStatus } from "@types";

export const SUBMISSION_STATUS_VARIANT: Record<
  SubmissionStatus,
  "default" | "secondary" | "destructive"
> = {
  submitted: "secondary",
  approved: "default",
  needs_work: "destructive",
};
