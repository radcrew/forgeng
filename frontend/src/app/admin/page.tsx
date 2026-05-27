"use client";

import { PageContainer, PageHeader } from "@components/shared";
import { AdminView, useAdminDashboard } from "@features/dashboard";

const Page = () => {
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
      <AdminView dashboard={dashboard} />
    </PageContainer>
  );
};

export default Page;
