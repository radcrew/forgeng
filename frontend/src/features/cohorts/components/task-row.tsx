import { format } from "date-fns";
import { CheckSquare } from "lucide-react";

import { ClickableCard } from "@components/common";
import { Badge } from "@components/ui/badge";
import { Card } from "@components/ui/card";
import { TASK_TYPE_ICON } from "@constants/tasks";
import { SubmissionStatusBadge } from "@features/submissions";
import type { Submission, TaskStatus, TaskType } from "@types";

export type CohortTaskRowProps = {
  title: string;
  type: TaskType;
  status: TaskStatus;
  dueDate: string | null;
  submissions: Submission[];
  onReview: (submission: Submission) => void;
};

export const CohortTaskRow = ({
  title,
  type,
  status,
  dueDate,
  submissions,
  onReview,
}: CohortTaskRowProps) => {
  const Icon = TASK_TYPE_ICON[type] ?? CheckSquare;
  const pending = submissions.filter((s) => s.status === "submitted").length;

  return (
    <Card>
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {type}
            </Badge>
            <span>{submissions.length} submissions</span>
            {pending > 0 && <span>{pending} awaiting review</span>}
            {dueDate && <span>Due {format(new Date(dueDate), "MMM d")}</span>}
          </div>
        </div>
        <Badge
          variant={status === "published" ? "default" : "secondary"}
          className="shrink-0 capitalize"
        >
          {status}
        </Badge>
      </div>

      {submissions.length > 0 && (
        <div className="space-y-2 border-t px-4 py-3">
          {submissions.map((s) => (
            <ClickableCard key={s.id} onClick={() => onReview(s)}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {s.user?.name ?? s.user?.email ?? "Unknown student"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(s.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <SubmissionStatusBadge status={s.status} showIcon={false} />
            </ClickableCard>
          ))}
        </div>
      )}
    </Card>
  );
};
