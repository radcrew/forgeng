import { Badge } from "@components/ui/badge";
import { APPLICATION_STATUS_VARIANT } from "../_lib/constants";
import type { ApplicationStatus } from "@lib/types";

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
}

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  return (
    <Badge variant={APPLICATION_STATUS_VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  );
}
