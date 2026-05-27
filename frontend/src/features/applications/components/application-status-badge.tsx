import { StatusBadge } from "@components/common";

import { APPLICATION_STATUS_VARIANT } from "../constants";
import type { ApplicationStatus } from "@types";

export type ApplicationStatusBadgeProps = {
  status: ApplicationStatus;
};

export const ApplicationStatusBadge = ({
  status,
}: ApplicationStatusBadgeProps) => (
  <StatusBadge status={status} variantMap={APPLICATION_STATUS_VARIANT} />
);
