"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CheckSquare, ClipboardList, Users } from "lucide-react";

import { ClickableCard, LoadingState } from "@components/common";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Progress } from "@components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { COHORT_STATUS_VARIANT } from "@constants/cohorts";
import { TASK_TYPE_ICON } from "@constants/tasks";
import {
  ReviewSheet,
  StatusBadge,
  useSubmissions,
} from "@features/submissions";
import { useTasks } from "@features/tasks";
import type { Submission, SubmissionStatus, TaskStatus, TaskType } from "@types";

import { useCohort, useEnrollments } from "../hooks";
import { Enrollments } from "./enrollments";

export type CohortDetailProps = { cohortId: number };

type StudentProgress = {
  userId: number;
  name: string;
  email: string;
  approved: number;
  submitted: number;
  needsWork: number;
  todo: number;
};

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

  const publishedTaskCount = useMemo(
    () => tasks.filter((t) => t.status === "published").length,
    [tasks],
  );
  const pendingReviews = useMemo(
    () => submissions.filter((s) => s.status === "submitted").length,
    [submissions],
  );

  // Per-student progress: the latest submission per (student, task) decides
  // that task's current state. `submissions` arrives newest-first, so the
  // first time we see a (userId, taskId) pair is its latest status.
  const progress = useMemo<StudentProgress[]>(() => {
    const latest = new Map<string, SubmissionStatus>();
    for (const s of submissions) {
      if (!s.user) continue;
      const key = `${s.user.id}:${s.taskId}`;
      if (!latest.has(key)) latest.set(key, s.status);
    }

    return enrollments
      .map((e) => {
        const user = e.user;
        const counts = { approved: 0, submitted: 0, needsWork: 0 };
        for (const t of tasks) {
          if (t.status !== "published") continue;
          const status = latest.get(`${e.userId}:${t.id}`);
          if (status === "approved") counts.approved += 1;
          else if (status === "needs_work") counts.needsWork += 1;
          else if (status === "submitted") counts.submitted += 1;
        }
        const done = counts.approved + counts.submitted + counts.needsWork;
        return {
          userId: e.userId,
          name: user?.name ?? user?.email ?? "Unknown",
          email: user?.email ?? "",
          ...counts,
          todo: Math.max(0, publishedTaskCount - done),
        };
      })
      .sort((a, b) => b.approved - a.approved);
  }, [enrollments, tasks, submissions, publishedTaskCount]);

  if (isLoading) {
    return (
      <PageContainer maxWidth="5xl" spacing="6">
        {backLink}
        <LoadingState message="Loading cohort…" />
      </PageContainer>
    );
  }

  if (error || !cohort) {
    return (
      <PageContainer maxWidth="5xl" spacing="6">
        {backLink}
        <EmptyState message="Cohort not found." />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="5xl" spacing="8">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Students"
          value={`${cohort.enrolledCount} / ${cohort.capacity}`}
        />
        <StatCard
          icon={<CheckSquare className="h-4 w-4" />}
          label="Tasks"
          value={`${publishedTaskCount} published`}
          hint={`${tasks.length} total`}
        />
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Submissions"
          value={`${submissions.length}`}
        />
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Pending Reviews"
          value={`${pendingReviews}`}
        />
      </div>

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
          <EmptyState message="No students enrolled in this cohort yet." />
        ) : (
          <div className="space-y-3">
            {progress.map((p) => (
              <StudentRow
                key={p.userId}
                progress={p}
                total={publishedTaskCount}
              />
            ))}
          </div>
        )
      ) : tasks.length === 0 ? (
        <EmptyState message="No tasks in this cohort yet." />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const taskSubs = submissions.filter((s) => s.taskId === task.id);
            return (
              <TaskRow
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

const StatCard = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);

const StudentRow = ({
  progress,
  total,
}: {
  progress: StudentProgress;
  total: number;
}) => {
  const pct = total > 0 ? Math.round((progress.approved / total) * 100) : 0;
  return (
    <Card>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
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

const TaskRow = ({
  title,
  type,
  status,
  dueDate,
  submissions,
  onReview,
}: {
  title: string;
  type: TaskType;
  status: TaskStatus;
  dueDate: string | null;
  submissions: Submission[];
  onReview: (submission: Submission) => void;
}) => {
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
              <StatusBadge status={s.status} showIcon={false} />
            </ClickableCard>
          ))}
        </div>
      )}
    </Card>
  );
};
