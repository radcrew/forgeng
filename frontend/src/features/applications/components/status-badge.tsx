import { StatusBadge as BaseStatusBadge } from "@components/common";
import { APPLICATION_STATUS_VARIANT } from "@constants/applications";
import type { ApplicationStatus } from "@types";

export type StatusBadgeProps = {
  status: ApplicationStatus;
};

export const StatusBadge = ({ status }: StatusBadgeProps) => (
  <BaseStatusBadge status={status} variantMap={APPLICATION_STATUS_VARIANT} />
);
