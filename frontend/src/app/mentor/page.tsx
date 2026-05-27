"use client";

import { PageContainer, PageHeader } from "@components/shared";
import {
  MentorDashboardView,
  useMentorDashboard,
} from "@features/dashboard";

const MentorDashboardPage = () => {
  const { data: dashboard, isLoading } = useMentorDashboard();

  if (isLoading || !dashboard) {
    return (
      <PageContainer maxWidth="6xl" spacing="8">
        <PageHeader title="Mentor Dashboard" description="Loading…" />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="6xl" spacing="8">
      <PageHeader
        title="Mentor Dashboard"
        description="Overview of your assigned cohorts and pending reviews."
      />
      <MentorDashboardView dashboard={dashboard} />
    </PageContainer>
  );
};

export default MentorDashboardPage;
