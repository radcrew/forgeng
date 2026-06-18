import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";

import type { Application } from "@types";
import { isApplicationComplete } from "@utils/user";
import { ApplicationStatusBadge } from "./status-badge";

export type ApplicationRowProps = {
  application: Application;
  onSelect: () => void;
};

export const ApplicationRow = ({ application, onSelect }: ApplicationRowProps) => {
  const incomplete = !isApplicationComplete(application);

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="font-semibold flex items-center gap-2 flex-wrap">
            {application.firstName} {application.lastName}
            {incomplete && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Incomplete profile
              </span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">{application.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {format(new Date(application.createdAt), "MMM d, yyyy")}
          </span>
          <ApplicationStatusBadge status={application.status} />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            Review
          </Button>
        </div>
      </div>
    </Card>
  );
};
