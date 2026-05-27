import type { CohortStatus } from "@types";

import type { LabeledValue } from "../shared/labeled-value";

export const COHORT_STATUS_OPTIONS: LabeledValue<CohortStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];
