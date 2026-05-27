import { AlertCircle, CheckCircle2 } from "lucide-react";

import { StatusBadge } from "@components/common";

import { SUBMISSION_STATUS_VARIANT } from "../constants";
import type { SubmissionStatus } from "@types";

export type SubmissionStatusBadgeProps = {
  status: SubmissionStatus;
  showIcon?: boolean;
};

export const SubmissionStatusBadge = ({
  status,
  showIcon = true,
}: SubmissionStatusBadgeProps) => {
  const leadingIcon =
    showIcon && status === "approved" ? (
      <CheckCircle2 className="h-3 w-3 mr-1" />
    ) : showIcon && status === "needs_work" ? (
      <AlertCircle className="h-3 w-3 mr-1" />
    ) : undefined;

  return (
    <StatusBadge
      status={status}
      variantMap={SUBMISSION_STATUS_VARIANT}
      leadingIcon={leadingIcon}
    />
  );
};
