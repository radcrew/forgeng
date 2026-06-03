"use client";

import { PageContainer, PageHeader } from "@components/shared";
import {
  StudentOnboarding,
  StudentView,
  useStudentDashboard,
} from "@features/dashboard";
import { useCurrentUser } from "@contexts";

const Page = () => {
  const { data: dashboard, isLoading } = useStudentDashboard();
  const { user } = useCurrentUser();

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
            "Let's get you started."
          )
        }
      />
      {cohort ? (
        <StudentView dashboard={dashboard} />
      ) : (
        <StudentOnboarding name={user?.name} />
      )}
    </PageContainer>
  );
};

export default Page;
