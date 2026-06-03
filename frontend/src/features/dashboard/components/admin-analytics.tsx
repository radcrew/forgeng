"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { COHORT_STATUS_VARIANT } from "@constants/cohorts";
import type { AdminDashboard } from "@types";

export type AdminAnalyticsProps = { dashboard: AdminDashboard };

type Segment = { label: string; value: number; color: string };

const SegmentedBar = ({ segments }: { segments: Segment[] }) => {
  const total = segments.reduce((n, s) => n + s.value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }

  return (
    <>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((s) =>
          s.value === 0 ? null : (
            <div
              key={s.label}
              className={s.color}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ),
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} aria-hidden />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium">{s.value}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export const AdminAnalytics = ({ dashboard }: AdminAnalyticsProps) => {
  const { applicationStats, analytics } = dashboard;
  const { submissionBreakdown, weeklyActivity, cohortStats } = analytics;

  const maxWeek = Math.max(1, ...weeklyActivity.map((w) => w.submissions));
  const totalActivity = weeklyActivity.reduce((n, w) => n + w.submissions, 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SegmentedBar
            segments={[
              {
                label: "Approved",
                value: submissionBreakdown.approved,
                color: "bg-primary",
              },
              {
                label: "In Review",
                value: submissionBreakdown.submitted,
                color: "bg-sky-500",
              },
              {
                label: "Needs Work",
                value: submissionBreakdown.needsWork,
                color: "bg-destructive",
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SegmentedBar
            segments={[
              {
                label: "Accepted",
                value: applicationStats.accepted,
                color: "bg-primary",
              },
              {
                label: "Reviewing",
                value: applicationStats.reviewing,
                color: "bg-sky-500",
              },
              {
                label: "Pending",
                value: applicationStats.pending,
                color: "bg-amber-500",
              },
              {
                label: "Rejected",
                value: applicationStats.rejected,
                color: "bg-destructive",
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Submission Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-end gap-3">
            {weeklyActivity.map((w, i) => (
              <div
                key={w.weekStart}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-primary/70"
                    style={{ height: `${(w.submissions / maxWeek) * 100}%` }}
                    title={`${w.submissions} submissions`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {i === weeklyActivity.length - 1
                    ? "This wk"
                    : `-${weeklyActivity.length - 1 - i}w`}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {totalActivity} submission{totalActivity === 1 ? "" : "s"} in the
            last {weeklyActivity.length} weeks
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Cohorts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cohortStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cohorts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Cohort</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Students</th>
                    <th className="pb-2 text-right font-medium">Tasks</th>
                    <th className="pb-2 text-right font-medium">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortStats.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-2">
                        <Link
                          href={`/admin/cohorts/${c.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-2">
                        <Badge
                          variant={COHORT_STATUS_VARIANT[c.status]}
                          className="capitalize"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {c.students}
                      </td>
                      <td className="py-2 text-right tabular-nums">{c.tasks}</td>
                      <td className="py-2 text-right tabular-nums">
                        {c.submissions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
