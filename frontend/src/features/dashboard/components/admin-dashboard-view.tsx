"use client";

import Link from "next/link";
import { format } from "date-fns";
import { BookOpen, ClipboardList, FileText, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { EmptyState } from "@components/shared";
import type { AdminDashboard } from "../types";

export type AdminDashboardViewProps = { dashboard: AdminDashboard };

export const AdminDashboardView = ({ dashboard }: AdminDashboardViewProps) => (
  <>
    <div className="grid gap-6 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {dashboard.applicationStats.pending}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            pending of {dashboard.applicationStats.total} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{dashboard.totalStudents}</div>
          <p className="text-xs text-muted-foreground mt-1">enrolled</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Mentors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{dashboard.totalMentors}</div>
          <p className="text-xs text-muted-foreground mt-1">active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Cohorts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{dashboard.activeCohorts}</div>
          <p className="text-xs text-muted-foreground mt-1">active</p>
        </CardContent>
      </Card>
    </div>

    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Applications</h2>
        <Link
          href="/admin/applications"
          className="text-sm text-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      {dashboard.recentApplications.length === 0 ? (
        <EmptyState message="No recent applications." size="compact" />
      ) : (
        <div className="space-y-3">
          {dashboard.recentApplications.map((app) => (
            <Card key={app.id}>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">
                    {app.firstName} {app.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{app.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground capitalize">
                    {app.status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(app.createdAt), "MMM d")}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  </>
);
