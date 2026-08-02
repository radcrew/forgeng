"use client";

import { ProgressArt, TaskListArt } from "@components/illustrations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { TASK_TYPE_ICON } from "@constants/tasks";
import type { StudentAnalytics as Analytics } from "@types";

export type StudentAnalyticsProps = { analytics: Analytics };

const STATUS_SEGMENTS = [
  { key: "approved", label: "Approved", color: "bg-primary" },
  { key: "submitted", label: "In Review", color: "bg-sky-500" },
  { key: "needsWork", label: "Needs Work", color: "bg-destructive" },
  { key: "todo", label: "To Do", color: "bg-muted-foreground/30" },
] as const;

export const StudentAnalytics = ({ analytics }: StudentAnalyticsProps) => {
  const { statusBreakdown, typeBreakdown } = analytics;
  const statusTotal =
    statusBreakdown.todo +
    statusBreakdown.submitted +
    statusBreakdown.needsWork +
    statusBreakdown.approved;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Task Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusTotal === 0 ? (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <ProgressArt className="h-12 w-12" />
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            </div>
          ) : (
            <>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {STATUS_SEGMENTS.map((s) => {
                  const value = statusBreakdown[s.key];
                  if (value === 0) return null;
                  return (
                    <div
                      key={s.key}
                      className={s.color}
                      style={{ width: `${(value / statusTotal) * 100}%` }}
                    />
                  );
                })}
              </div>
              <div className="space-y-2">
                {STATUS_SEGMENTS.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 text-sm">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${s.color}`}
                      aria-hidden
                    />
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="ml-auto font-medium">
                      {statusBreakdown[s.key]}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            By Task Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {typeBreakdown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <TaskListArt className="h-12 w-12" />
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            </div>
          ) : (
            typeBreakdown.map((t) => {
              const Icon = TASK_TYPE_ICON[t.type];
              const pct = t.total > 0 ? (t.approved / t.total) * 100 : 0;
              return (
                <div key={t.type} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {Icon && (
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="capitalize">{t.type}</span>
                    <span className="ml-auto text-muted-foreground">
                      {t.approved}/{t.total} approved
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
