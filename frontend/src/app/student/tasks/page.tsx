"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Clock, Code2 } from "lucide-react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { LoadingState } from "@components/common";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { SubmissionStatusBadge } from "@features/submissions";
import { TaskSubmitDialog } from "@features/tasks";
import {
  TASK_PROGRESS_FILTER_TABS,
  TASK_SORT_OPTIONS,
  TASK_TYPE_ICON,
  TASK_TYPE_OPTIONS,
  type TaskProgressFilter,
  type TaskSort,
} from "@constants/tasks";
import { APP_ART } from "@constants/shared/app-illustrations";
import { CohortSwitcher, useStudentDashboard } from "@features/dashboard";
import { useSubmissions } from "@features/submissions";
import { useTasks } from "@features/tasks";
import { useSelectedCohort } from "@contexts";
import { cn } from "@utils";
import type { Task, TaskType } from "@types";

type TypeFilter = TaskType | "all";

const Page = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [progressFilter, setProgressFilter] =
    useState<TaskProgressFilter>("all");
  const [sort, setSort] = useState<TaskSort>("due");
  // Captured once at mount so overdue checks stay pure across re-renders.
  const [now] = useState(() => Date.now());

  const { selectedCohortId } = useSelectedCohort();
  const { data: dashboard, isLoading: dashboardLoading } =
    useStudentDashboard(selectedCohortId);
  const cohortId = dashboard?.cohort?.id;
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(cohortId);
  const { data: submissions = [], refetch: refetchSubmissions } =
    useSubmissions();

  const submissionByTaskId = useMemo(
    () => new Map(submissions.map((s) => [s.taskId, s])),
    [submissions],
  );

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      if (typeFilter !== "all" && task.type !== typeFilter) return false;
      const progress = submissionByTaskId.get(task.id)?.status ?? "todo";
      if (progressFilter !== "all" && progress !== progressFilter) return false;
      if (query && !task.title.toLowerCase().includes(query)) return false;
      return true;
    });

    if (sort === "due") {
      // Soonest due date first; tasks without a due date sink to the bottom.
      return [...filtered].sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aTime - bTime;
      });
    }
    // "recent" — the backend already returns tasks newest-first.
    return filtered;
  }, [tasks, submissionByTaskId, search, typeFilter, progressFilter, sort]);

  // Keep stale data on screen while switching cohorts so the page (and the
  // switcher) don't flash back to the loading state.
  if (!dashboard) {
    return (
      <PageContainer maxWidth="4xl">
        <PageHeader title="Tasks" description="Loading…" />
      </PageContainer>
    );
  }

  if (!dashboard.cohort) {
    return (
      <PageContainer maxWidth="4xl">
        <PageHeader
          title="Tasks"
          description="Enroll in a cohort to see your assignments."
        />
        <EmptyState message="You are not enrolled in a cohort yet." art={APP_ART.cohort} />
      </PageContainer>
    );
  }

  const cohort = dashboard.cohort;
  const hasTasks = !tasksLoading && tasks.length > 0;

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title="Tasks"
        description={
          hasTasks
            ? `${cohort.name} — ${visibleTasks.length} of ${tasks.length} tasks`
            : cohort.name
        }
        actions={
          <CohortSwitcher
            cohorts={dashboard.cohorts}
            activeCohortId={cohort.id}
            disabled={dashboardLoading}
          />
        }
      />

      {hasTasks && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:flex-1"
            />
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TASK_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as TaskSort)}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    Sort: {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs
            value={progressFilter}
            onValueChange={(v) => setProgressFilter(v as TaskProgressFilter)}
          >
            <TabsList>
              {TASK_PROGRESS_FILTER_TABS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {tasksLoading ? (
        <LoadingState message="Loading tasks…" />
      ) : tasks.length === 0 ? (
        <EmptyState
          message="No tasks have been published for your cohort yet."
          art={APP_ART.tasks}
        />
      ) : visibleTasks.length === 0 ? (
        <EmptyState message="No tasks match your filters." art={APP_ART.noResults} />
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => {
            const submission = submissionByTaskId.get(task.id);
            const progress = submission?.status ?? "todo";
            const isOverdue =
              !!task.dueDate &&
              new Date(task.dueDate).getTime() < now &&
              (progress === "todo" || progress === "needs_work");
            const Icon = TASK_TYPE_ICON[task.type] ?? Code2;
            return (
              <Card
                key={task.id}
                className={cn(
                  "hover:shadow-md transition-shadow",
                  isOverdue && "border-destructive/40",
                )}
              >
                <div className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/student/tasks/${task.id}`}
                      className="block font-semibold truncate hover:underline"
                    >
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge
                        variant="outline"
                        className="capitalize text-xs"
                      >
                        {task.type}
                      </Badge>
                      {task.dueDate && (
                        <span
                          className={cn(
                            "text-xs flex items-center gap-1",
                            isOverdue
                              ? "text-destructive font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          <Clock className="h-3 w-3" />
                          {isOverdue ? "Overdue · " : "Due "}
                          {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {submission ? (
                      <SubmissionStatusBadge status={submission.status} />
                    ) : (
                      <Button size="sm" onClick={() => setSelectedTask(task)}>
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <TaskSubmitDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
          onSubmitted={refetchSubmissions}
        />
      )}
    </PageContainer>
  );
};

export default Page;
