"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Users } from "lucide-react";

import { LoadingState } from "@components/common";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import { COHORT_STATUS_VARIANT } from "@constants/cohorts";
import { ReviewSheet, useSubmissions } from "@features/submissions";
import { useTasks } from "@features/tasks";

import { useCohort, useCohortStats, useEnrollments } from "../hooks";
import { CohortDetailStats } from "./detail-stats";
import { CohortStudentProgressRow } from "./student-progress-row";
import { CohortTaskRow } from "./task-row";
import { Enrollments } from "./enrollments";

export type CohortDetailProps = { cohortId: number };

const backLink = (
  <Link
    href="/admin/cohorts"
    className="text-sm text-muted-foreground hover:text-foreground inline-block"
  >
    ← Back to Cohorts
  </Link>
);

export const CohortDetail = ({ cohortId }: CohortDetailProps) => {
  const { data: cohort, isLoading, error } = useCohort(cohortId);
  const { data: enrollments = [], refetch: refetchEnrollments } =
    useEnrollments(cohortId);
  const { data: tasks = [] } = useTasks(cohortId);
  const { data: submissions = [], refetch: refetchSubmissions } =
    useSubmissions({ cohortId });

  const [tab, setTab] = useState<"students" | "tasks">("students");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const reviewing = submissions.find((s) => s.id === reviewId);

  const { publishedTaskCount, pendingReviews, progress } = useCohortStats(
    enrollments,
    tasks,
    submissions,
  );

  if (isLoading) {
    return (
      <PageContainer spacing="6">
        {backLink}
        <LoadingState message="Loading cohort…" />
      </PageContainer>
    );
  }

  if (error || !cohort) {
    return (
      <PageContainer spacing="6">
        {backLink}
        <EmptyState message="Cohort not found." art={APP_ART.notFoundItem} />
      </PageContainer>
    );
  }

  return (
    <PageContainer spacing="8">
      {backLink}

      <PageHeader
        title={cohort.name}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <Badge
              variant={COHORT_STATUS_VARIANT[cohort.status]}
              className="capitalize"
            >
              {cohort.status}
            </Badge>
            {cohort.startDate && (
              <span className="text-xs">
                {format(new Date(cohort.startDate), "MMM d, yyyy")}
                {cohort.endDate &&
                  ` → ${format(new Date(cohort.endDate), "MMM d, yyyy")}`}
              </span>
            )}
          </span>
        }
        actions={
          <Button variant="outline" onClick={() => setEnrollOpen(true)}>
            <Users className="h-4 w-4 mr-2" /> Enrollments
          </Button>
        }
      />

      {cohort.description && (
        <p className="text-sm text-muted-foreground break-words">
          {cohort.description}
        </p>
      )}

      <CohortDetailStats
        cohort={cohort}
        totalTaskCount={tasks.length}
        publishedTaskCount={publishedTaskCount}
        submissionCount={submissions.length}
        pendingReviews={pendingReviews}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="students">
            Students ({enrollments.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "students" ? (
        enrollments.length === 0 ? (
          <EmptyState
            message="No students enrolled in this cohort yet."
            art={APP_ART.cohort}
          />
        ) : (
          <div className="space-y-3">
            {progress.map((p) => (
              <CohortStudentProgressRow
                key={p.userId}
                progress={p}
                total={publishedTaskCount}
              />
            ))}
          </div>
        )
      ) : tasks.length === 0 ? (
        <EmptyState message="No tasks in this cohort yet." art={APP_ART.tasks} />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const taskSubs = submissions.filter((s) => s.taskId === task.id);
            return (
              <CohortTaskRow
                key={task.id}
                title={task.title}
                type={task.type}
                status={task.status}
                dueDate={task.dueDate}
                submissions={taskSubs}
                onReview={(s) => setReviewId(s.id)}
              />
            );
          })}
        </div>
      )}

      {reviewing && (
        <ReviewSheet
          submission={reviewing}
          open={!!reviewId}
          onClose={() => setReviewId(null)}
          onReviewed={refetchSubmissions}
        />
      )}

      <Enrollments
        cohort={cohort}
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        onEnrolled={refetchEnrollments}
      />
    </PageContainer>
  );
};
