import { Badge } from "@components/ui/badge";

import { APPLICATION_STATUS_VARIANT } from "../constants";
import type { ApplicationStatus } from "@types";

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
