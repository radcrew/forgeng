"use client";

import { PageContainer, PageHeader } from "@components/shared";
import { StudentView, useStudentDashboard } from "@features/dashboard";

const Page = () => {
  const { data: dashboard, isLoading } = useStudentDashboard();

  if (isLoading || !dashboard) {
    return (
      <PageContainer maxWidth="6xl" spacing="8">
        <PageHeader title="Student Dashboard" description="Loading…" />
      </PageContainer>
    );
  }

  const { cohort } = dashboard;

  return (
    <PageContainer maxWidth="6xl" spacing="8">
      <PageHeader
        title="Student Dashboard"
        description={
          cohort ? (
            <>
              Welcome back. You are enrolled in{" "}
              <span className="font-semibold text-foreground">
                {cohort.name}
              </span>
              .
            </>
          ) : (
            "Welcome back. You are not enrolled in a cohort yet."
          )
        }
      />
      <StudentView dashboard={dashboard} />
    </PageContainer>
  );
};

export default Page;
