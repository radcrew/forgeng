import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Badge } from "@components/ui/badge";

import { SUBMISSION_STATUS_VARIANT } from "../constants";
import type { SubmissionStatus } from "../types";

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus;
  showIcon?: boolean;
}

export function SubmissionStatusBadge({
  status,
  showIcon = true,
}: SubmissionStatusBadgeProps) {
  return (
    <Badge variant={SUBMISSION_STATUS_VARIANT[status]} className="capitalize">
      {showIcon && status === "approved" && (
        <CheckCircle2 className="h-3 w-3 mr-1" />
      )}
      {showIcon && status === "needs_work" && (
        <AlertCircle className="h-3 w-3 mr-1" />
      )}
      {status.replace("_", " ")}
    </Badge>
  );
}
