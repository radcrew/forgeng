"use client";

import { PageContainer, PageHeader } from "@components/shared";
import { MentorView, useMentorDashboard } from "@features/dashboard";

const Page = () => {
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
      <MentorView dashboard={dashboard} />
    </PageContainer>
  );
};

export default Page;
