"use client";

import { PageContainer, PageHeader } from "@components/shared";
import {
  CohortSwitcher,
  StudentOnboarding,
  StudentView,
  useStudentDashboard,
} from "@features/dashboard";
import { useCurrentUser, useSelectedCohort } from "@contexts";

const Page = () => {
  const { selectedCohortId } = useSelectedCohort();
  const { data: dashboard, isLoading } = useStudentDashboard(selectedCohortId);
  const { user } = useCurrentUser();

  // Keep the stale dashboard on screen while switching cohorts so the page
  // (and the switcher) don't flash back to the loading state.
  if (!dashboard) {
    return (
      <PageContainer maxWidth="6xl" spacing="8">
        <PageHeader title="Student Dashboard" description="Loading…" />
      </PageContainer>
    );
  }

  const { cohort, cohorts } = dashboard;

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
        actions={
          cohort ? (
            <CohortSwitcher
              cohorts={cohorts}
              activeCohortId={cohort.id}
              disabled={isLoading}
            />
          ) : undefined
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
