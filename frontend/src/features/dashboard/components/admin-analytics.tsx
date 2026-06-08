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
            <span className="font-medium">{s.value}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export const AdminAnalytics = ({ dashboard }: AdminAnalyticsProps) => {
  const { applicationStats, analytics } = dashboard;
  const { submissionBreakdown, cohortStats } = analytics;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            <Link href="/admin/applications" className="hover:underline">
              Applications
            </Link>
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            <Link href="/admin/reviews" className="hover:underline">
              Submissions
            </Link>
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
