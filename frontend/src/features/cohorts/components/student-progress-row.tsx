import { Card } from "@components/ui/card";
import { Progress } from "@components/ui/progress";
import type { CohortStudentProgress } from "../types";

export type CohortStudentProgressRowProps = {
  progress: CohortStudentProgress;
  total: number;
};

export const CohortStudentProgressRow = ({
  progress,
  total,
}: CohortStudentProgressRowProps) => {
  const pct = total > 0 ? Math.round((progress.approved / total) * 100) : 0;
  return (
    <Card>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary-strong">
            {progress.name[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{progress.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {progress.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:w-72">
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {progress.approved}/{total} approved
              </span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {progress.submitted > 0 && (
              <span title="Awaiting review">{progress.submitted} ⏳</span>
            )}
            {progress.needsWork > 0 && (
              <span className="text-amber-600" title="Needs work">
                {progress.needsWork} ✎
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
