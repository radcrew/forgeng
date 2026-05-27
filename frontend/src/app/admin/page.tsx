import Link from "next/link";
import { format } from "date-fns";
import { BookOpen, ClipboardList, FileText, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { mockAdminDashboard } from "@lib/mock-data";

export default function AdminDashboardPage() {
  const dashboard = mockAdminDashboard;

  return (
    <PageContainer maxWidth="6xl" spacing="8">
      <PageHeader
        title="Admin Dashboard"
        description="Platform overview and recent activity."
      />

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
            <p className="text-sm text-muted-foreground mt-2">
              pending review
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
            <div className="text-4xl font-bold">{dashboard.activeCohorts}</div>
            <p className="text-sm text-muted-foreground mt-2">
              currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dashboard.totalStudents}</div>
            <p className="text-sm text-muted-foreground mt-2">
              enrolled learners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Total Mentors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dashboard.totalMentors}</div>
            <p className="text-sm text-muted-foreground mt-2">
              active guides
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Application Pipeline</h2>
            <Link
              href="/admin/applications"
              className="text-sm font-medium text-primary hover:underline"
            >
              Manage applications
            </Link>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold">
                    {dashboard.applicationStats.total}
                  </span>
                </div>
                <div className="h-px bg-border w-full" />
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-sm">Pending</span>
                  <span>{dashboard.applicationStats.pending}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-sm">Reviewing</span>
                  <span>{dashboard.applicationStats.reviewing}</span>
                </div>
                <div className="flex items-center justify-between text-primary">
                  <span className="text-sm font-medium">Accepted</span>
                  <span className="font-bold">
                    {dashboard.applicationStats.accepted}
                  </span>
                </div>
                <div className="flex items-center justify-between text-destructive">
                  <span className="text-sm">Rejected</span>
                  <span>{dashboard.applicationStats.rejected}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Applications</h2>
            <Link
              href="/admin/applications"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {dashboard.recentApplications.length === 0 ? (
            <EmptyState message="No recent applications." size="compact" />
          ) : (
            <div className="space-y-4">
              {dashboard.recentApplications.map((app) => (
                <Card key={app.id}>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {app.firstName} {app.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {app.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary capitalize">
                        {app.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(app.createdAt), "MMM d")}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
