"use client";

import { PageContainer, PageHeader } from "@components/shared";
import {
  AdminDashboardView,
  useAdminDashboard,
} from "@features/dashboard";

const AdminDashboardPage = () => {
  const { data: dashboard, isLoading } = useAdminDashboard();

  if (isLoading || !dashboard) {
    return (
      <PageContainer maxWidth="6xl" spacing="8">
        <PageHeader
          title="Admin Dashboard"
          description="Platform overview and recent activity."
        />
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="6xl" spacing="8">
      <PageHeader
        title="Admin Dashboard"
        description="Platform overview and recent activity."
      />
      <AdminDashboardView dashboard={dashboard} />
    </PageContainer>
  );
};

export default AdminDashboardPage;
