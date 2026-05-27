"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ClipboardList, FileText, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { EmptyState } from "@components/shared";
import type { MentorDashboard } from "../types";

export type MentorViewProps = { dashboard: MentorDashboard };

export const MentorView = ({ dashboard }: MentorViewProps) => (
  <>
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Pending Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {dashboard.pendingReviews}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Submissions awaiting your feedback
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Cohorts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {dashboard.cohortBreakdown.length}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Cohorts under your mentorship
          </p>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Cohort Breakdown</h2>
        </div>

        {dashboard.cohortBreakdown.length === 0 ? (
          <EmptyState message="No assigned cohorts yet." size="compact" />
        ) : (
          <div className="space-y-4">
            {dashboard.cohortBreakdown.map((cohort) => (
              <Card key={cohort.cohortId}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <p className="font-medium">{cohort.cohortName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{cohort.pendingCount}</p>
                    <p className="text-xs text-muted-foreground">
                      pending reviews
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Link
            href="/mentor/reviews"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all queue
          </Link>
        </div>

        {dashboard.recentActivity.length === 0 ? (
          <EmptyState message="No recent submissions." size="compact" />
        ) : (
          <div className="space-y-4">
            {dashboard.recentActivity.map((sub) => (
              <Card key={sub.id}>
                <div className="p-4 flex gap-4">
                  <div className="mt-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {sub.user?.name ?? sub.user?.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sub.task?.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Submitted {format(new Date(sub.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  </>
);
