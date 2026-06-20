"use client";

import { useMemo } from "react";

import { useAsyncResource } from "@hooks/use-async-resource";
import type { Enrollment, Submission, SubmissionStatus, Task } from "@types";

import { getCohort, listCohorts, listEnrollments } from "./api";
import type { CohortStudentProgress } from "./types";

export const useCohorts = () => useAsyncResource(() => listCohorts(), []);

export const useCohort = (cohortId: number) =>
  useAsyncResource(
    () =>
      Number.isFinite(cohortId)
        ? getCohort(cohortId)
        : Promise.reject(new Error("Invalid cohort id")),
    [cohortId],
  );

export const useEnrollments = (cohortId: number | undefined) =>
  useAsyncResource(
    () =>
      cohortId == null ? Promise.resolve([]) : listEnrollments(cohortId),
    [cohortId],
  );

export type CohortStats = {
  publishedTaskCount: number;
  pendingReviews: number;
  progress: CohortStudentProgress[];
};

/** Derives per-student progress and headline counts for the cohort detail page. */
export const useCohortStats = (
  enrollments: Enrollment[],
  tasks: Task[],
  submissions: Submission[],
): CohortStats => {
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
  const progress = useMemo<CohortStudentProgress[]>(() => {
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

  return { publishedTaskCount, pendingReviews, progress };
};
