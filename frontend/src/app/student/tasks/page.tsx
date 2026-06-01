"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Clock, Code2 } from "lucide-react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { LoadingState } from "@components/common";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { StatusBadge } from "@features/submissions";
import { SubmitDialog } from "@features/tasks";
import { TASK_TYPE_ICON } from "@constants/tasks";
import { useStudentDashboard } from "@features/dashboard";
import { useSubmissions } from "@features/submissions";
import { useTasks } from "@features/tasks";
import type { Task } from "@types";

const Page = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { data: dashboard, isLoading: dashboardLoading } = useStudentDashboard();
  const cohortId = dashboard?.cohort?.id;
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(cohortId);
  const { data: submissions = [], refetch: refetchSubmissions } =
    useSubmissions();

  const submissionByTaskId = useMemo(
    () => new Map(submissions.map((s) => [s.taskId, s])),
    [submissions],
  );

  if (dashboardLoading || !dashboard) {
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
        <EmptyState message="You are not enrolled in a cohort yet." />
      </PageContainer>
    );
  }

  const cohort = dashboard.cohort;

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title="Tasks"
        description={`${cohort.name} — ${tasks.length} tasks`}
      />

      {tasksLoading ? (
        <LoadingState message="Loading tasks…" />
      ) : tasks.length === 0 ? (
        <EmptyState message="No tasks have been published for your cohort yet." />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const submission = submissionByTaskId.get(task.id);
            const Icon = TASK_TYPE_ICON[task.type] ?? Code2;
            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
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
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {submission ? (
                      <StatusBadge status={submission.status} />
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
        <SubmitDialog
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
