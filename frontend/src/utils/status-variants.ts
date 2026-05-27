import type {
  ApplicationStatus,
  CohortStatus,
  SubmissionStatus,
} from "@types";

export const APPLICATION_STATUS_VARIANT: Record<
  ApplicationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  reviewing: "outline",
  accepted: "default",
  rejected: "destructive",
};

export const COHORT_STATUS_VARIANT: Record<
  CohortStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  draft: "secondary",
  completed: "outline",
};

export const SUBMISSION_STATUS_VARIANT: Record<
  SubmissionStatus,
  "default" | "secondary" | "destructive"
> = {
  submitted: "secondary",
  approved: "default",
  needs_work: "destructive",
};
