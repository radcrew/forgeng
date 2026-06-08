"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Progress } from "@components/ui/progress";
import type { StudentDashboard } from "../types";
import { StudentAnalytics } from "./student-analytics";
import { PaymentProgress } from "./payment-progress";

export type StudentViewProps = { dashboard: StudentDashboard };

export const StudentView = ({ dashboard }: StudentViewProps) => {
  const { taskStats, nextDeadline, analytics, monthlyPayment } = dashboard;
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

      <PaymentProgress monthlyPayment={monthlyPayment} />

      <StudentAnalytics analytics={analytics} />
    </>
  );
};
