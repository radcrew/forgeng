import type { SubmissionStatusFilter } from "@types";

import type { LabeledValue } from "../shared/labeled-value";

export const SUBMISSION_STATUS_FILTER_TABS: LabeledValue<SubmissionStatusFilter>[] =
  [
    { value: "submitted", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "needs_work", label: "Needs Work" },
    { value: "all", label: "All" },
  ];

/** The same tabs for students: everything first, then what they must fix. */
export const STUDENT_SUBMISSION_FILTER_TABS: LabeledValue<SubmissionStatusFilter>[] =
  [
    { value: "all", label: "All" },
    { value: "needs_work", label: "Needs Work" },
    { value: "submitted", label: "Pending" },
    { value: "approved", label: "Approved" },
  ];
