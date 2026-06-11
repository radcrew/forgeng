"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Code2, Users } from "lucide-react";

import { LoadingState } from "@components/common";
import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { Progress } from "@components/ui/progress";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { useSelectedCohort } from "@contexts";
import { SubmissionStatusBadge } from "@features/submissions";
import { useSubmissions } from "@features/submissions";
import { CohortSwitcher, useStudentDashboard } from "@features/dashboard";
import { useTasks } from "@features/tasks";
import { TASK_TYPE_ICON } from "@constants/tasks";

const dateRange = (start: string | null, end: string | null): string | null => {
  if (!start && !end) return null;
  const fmt = (d: string) => format(new Date(d), "MMM d, yyyy");
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start ? `Starts ${fmt(start)}` : `Ends ${fmt(end!)}`;
};

const Page = () => {
  const { selectedCohortId } = useSelectedCohort();
  const { data: dashboard, isLoading: dashboardLoading } =
    useStudentDashboard(selectedCohortId);
  const cohort = dashboard?.cohort ?? null;
  const cohorts = dashboard?.cohorts ?? [];
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(cohort?.id);
  const { data: submissions = [] } = useSubmissions();

  const submissionByTaskId = useMemo(
    () => new Map(submissions.map((s) => [s.taskId, s])),
    [submissions],
  );

  // Schedule: soonest due date first; undated tasks sink to the bottom.
  const schedule = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return at - bt;
      }),
    [tasks],
  );

  // Keep the stale dashboard on screen while switching cohorts so the page
  // (and the switcher) don't flash back to the loading state.
  if (!dashboard) {
    return (
      <PageContainer maxWidth="4xl" spacing="8">
        <PageHeader title="Cohort" description="Loading…" />
      </PageContainer>
    );
  }

  if (!cohort) {
    return (
      <PageContainer maxWidth="4xl" spacing="8">
        <PageHeader title="Cohort" description="Your cohort overview." />
        <EmptyState message="You are not enrolled in a cohort yet." />
      </PageContainer>
    );
  }

  const { taskStats } = dashboard;
  const progressPercent =
    taskStats.total > 0
      ? Math.round((taskStats.approved / taskStats.total) * 100)
      : 0;
  const range = dateRange(cohort.startDate, cohort.endDate);

  return (
    <PageContainer maxWidth="4xl" spacing="8">
      <PageHeader
        title={cohort.name}
        description="Your cohort overview."
        actions={
          <CohortSwitcher
            cohorts={cohorts}
            activeCohortId={cohort.id}
            disabled={dashboardLoading}
          />
        }
      />

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="capitalize">
              {cohort.status}
            </Badge>
            {range && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {range}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {cohort.enrolledCount} / {cohort.capacity} enrolled
            </span>
          </div>

          {cohort.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {cohort.description}
            </p>
          )}

          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your progress</span>
              <span className="font-medium">
                {taskStats.approved} of {taskStats.total} tasks completed
              </span>
            </div>
            <Progress value={progressPercent} className="mt-2 h-2" />
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Schedule</h2>
        {tasksLoading ? (
          <LoadingState message="Loading schedule…" />
        ) : schedule.length === 0 ? (
          <EmptyState message="No tasks have been published for your cohort yet." />
        ) : (
          <div className="space-y-3">
            {schedule.map((task) => {
              const submission = submissionByTaskId.get(task.id);
              const Icon = TASK_TYPE_ICON[task.type] ?? Code2;
              return (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/student/tasks/${task.id}`}
                        className="block truncate font-semibold hover:underline"
                      >
                        {task.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {task.dueDate
                          ? `Due ${format(new Date(task.dueDate), "MMM d, yyyy")}`
                          : "No due date"}
                      </p>
                    </div>
                    {submission ? (
                      <SubmissionStatusBadge status={submission.status} />
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Not started
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Page;
