import { AlertCircle, CheckCircle2 } from "lucide-react";

import { StatusBadge as BaseStatusBadge } from "@components/common";
import { SUBMISSION_STATUS_VARIANT } from "@constants/submissions";
import type { SubmissionStatus } from "@types";

export type StatusBadgeProps = {
  status: SubmissionStatus;
  showIcon?: boolean;
};

export const StatusBadge = ({ status, showIcon = true }: StatusBadgeProps) => {
  const leadingIcon =
    showIcon && status === "approved" ? (
      <CheckCircle2 className="h-3 w-3 mr-1" />
    ) : showIcon && status === "needs_work" ? (
      <AlertCircle className="h-3 w-3 mr-1" />
    ) : undefined;

  return (
    <BaseStatusBadge
      status={status}
      variantMap={SUBMISSION_STATUS_VARIANT}
      leadingIcon={leadingIcon}
    />
  );
};
