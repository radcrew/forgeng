"use client";

import Link from "next/link";
import { ClipboardList, FileText, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import type { AdminDashboard } from "../types";
import { AdminAnalytics } from "./admin-analytics";

export type AdminViewProps = { dashboard: AdminDashboard };

export const AdminView = ({ dashboard }: AdminViewProps) => (
  <>
    <div className="grid gap-6 md:grid-cols-3">
      <Link
        href="/admin/applications"
        className="rounded-lg transition-colors hover:bg-muted/40"
      >
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary-strong">
              {dashboard.applicationStats.pending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              pending of {dashboard.applicationStats.total} total
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link
        href="/admin/users"
        className="rounded-lg transition-colors hover:bg-muted/40"
      >
        <Card className="h-full">
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
      </Link>

      <Link
        href="/admin/reviews"
        className="rounded-lg transition-colors hover:bg-muted/40"
      >
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dashboard.pendingReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              submissions awaiting feedback
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>

    <AdminAnalytics dashboard={dashboard} />
  </>
);
