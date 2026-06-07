import type { ApplicationStatusFilter } from "@types";

import type { LabeledValue } from "../shared/labeled-value";

export const APPLICATION_STATUS_FILTER_TABS: LabeledValue<ApplicationStatusFilter>[] =
  [
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];
