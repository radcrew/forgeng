"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Clock, Code2, MessageSquare } from "lucide-react";

import { LoadingState, ProseBlock, SectionTitle } from "@components/common";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import { TASK_TYPE_ICON } from "@constants/tasks";
import { SubmissionDetailSheet, SubmissionStatusBadge, useSubmissions } from "@features/submissions";
import { TaskSubmitDialog, useTask } from "@features/tasks";

const Page = () => {
  const params = useParams<{ id: string }>();
  const taskId = Number(params?.id);

  const { data: task, isLoading, error } = useTask(taskId);
  const { data: submissions = [], refetch: refetchSubmissions } =
    useSubmissions();
  const submission = useMemo(
    () => submissions.find((s) => s.taskId === taskId),
    [submissions, taskId],
  );

  const [submitOpen, setSubmitOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const backLink = (
    <Link
      href="/student/tasks"
      className="text-sm text-muted-foreground hover:text-foreground inline-block"
    >
      ← Back to Tasks
    </Link>
  );

  if (isLoading) {
    return (
      <PageContainer maxWidth="reading" spacing="6">
        {backLink}
        <LoadingState message="Loading task…" />
      </PageContainer>
    );
  }

  if (error || !task) {
    return (
      <PageContainer maxWidth="reading" spacing="6">
        {backLink}
        <EmptyState
          message="Task not found, or you don't have access to it."
          art={APP_ART.notFoundItem}
        />
      </PageContainer>
    );
  }

  const Icon = TASK_TYPE_ICON[task.type] ?? Code2;

  return (
    <PageContainer maxWidth="reading" spacing="8">
      {backLink}

      <PageHeader
        title={task.title}
        description={
          <span className="flex items-center gap-3">
            <Badge variant="outline" className="capitalize">
              {task.type}
            </Badge>
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                Due {format(new Date(task.dueDate), "MMM d, yyyy")}
              </span>
            )}
          </span>
        }
        actions={
          submission ? (
            <Button variant="outline" onClick={() => setDetailOpen(true)}>
              View Submission
            </Button>
          ) : (
            <Button onClick={() => setSubmitOpen(true)}>Submit Work</Button>
          )
        }
      />

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <SectionTitle>Instructions</SectionTitle>
            {task.description ? (
              <ProseBlock className="mt-2 whitespace-pre-wrap">
                {task.description}
              </ProseBlock>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                No instructions were provided for this task.
              </p>
            )}
          </div>
        </div>
      </Card>

      <div>
        <SectionTitle className="mb-3">Your Submission</SectionTitle>
        {submission ? (
          <Card className="flex items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <SubmissionStatusBadge status={submission.status} />
              <span className="text-sm text-muted-foreground">
                Submitted{" "}
                {format(new Date(submission.createdAt), "MMM d, yyyy")}
              </span>
              {submission.feedbackCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {submission.feedbackCount}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailOpen(true)}
            >
              View &amp; Respond
            </Button>
          </Card>
        ) : (
          <EmptyState
            message="You haven't submitted work for this task yet."
            art={APP_ART.submissions}
          />
        )}
      </div>

      <TaskSubmitDialog
        task={task}
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onSubmitted={refetchSubmissions}
      />

      {submission && (
        <SubmissionDetailSheet
          submission={submission}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onResubmitted={refetchSubmissions}
        />
      )}
    </PageContainer>
  );
};

export default Page;
