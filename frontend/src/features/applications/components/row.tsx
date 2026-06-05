import { format } from "date-fns";

import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";

import type { Application } from "@types";
import { StatusBadge } from "./status-badge";

export type RowProps = {
  application: Application;
  onSelect: () => void;
};

export const Row = ({ application, onSelect }: RowProps) => {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="font-semibold">
            {application.firstName} {application.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{application.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {format(new Date(application.createdAt), "MMM d, yyyy")}
          </span>
          <StatusBadge status={application.status} />
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
