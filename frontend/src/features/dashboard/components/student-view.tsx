"use client";

import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, Code2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Progress } from "@components/ui/progress";
import { EmptyState } from "@components/shared";
import type { StudentDashboard } from "../types";
import { StatusBadge } from "@features/submissions";
import { StudentAnalytics } from "./student-analytics";

export type StudentViewProps = { dashboard: StudentDashboard };

export const StudentView = ({ dashboard }: StudentViewProps) => {
  const { taskStats, recentSubmissions, nextDeadline, analytics } = dashboard;
  const progressPercent =
    taskStats.total > 0
      ? Math.round((taskStats.approved / taskStats.total) * 100)
      : 0;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progressPercent}%</div>
            <Progress value={progressPercent} className="mt-4 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {taskStats.approved} of {taskStats.total} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taskStats.pending}</div>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Waiting to be completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className={nextDeadline ? "border-primary/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next Deadline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextDeadline ? (
              <>
                <div className="text-2xl font-bold">
                  {format(new Date(nextDeadline), "MMM d, yyyy")}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Keep up the good work!
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">
                  No upcoming
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  All caught up!
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <StudentAnalytics analytics={analytics} />

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Submissions</h2>
        {recentSubmissions.length === 0 ? (
          <EmptyState>
            <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
            <p>No submissions yet.</p>
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {recentSubmissions.map((sub) => (
              <Card key={sub.id}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {sub.status === "approved" ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : sub.status === "needs_work" ? (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">
                        {sub.task?.title ?? "Unknown Task"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submitted on{" "}
                        {format(new Date(sub.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={sub.status} showIcon={false} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
