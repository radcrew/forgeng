import type { ApplicationStatus } from "@types";

import type { LabeledValue } from "../shared/labeled-value";

export const APPLICATION_STATUS_OPTIONS: LabeledValue<ApplicationStatus>[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];
