"use client";

import { PageContainer, PageHeader } from "@components/shared";
import {
  CohortSwitcher,
  StudentView,
  useStudentDashboard,
} from "@features/dashboard";
import { useCurrentUser, useSelectedCohort } from "@contexts";
import { isProfileComplete } from "@utils/user";

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

  const profileIncomplete = user && !isProfileComplete(user);

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

      {profileIncomplete ? (
        <p className="text-sm text-muted-foreground">
          Your profile is incomplete. Please complete all profile fields to take
          part in a cohort and receive tasks.
        </p>
      ) : !cohort ? (
        <p className="text-sm text-muted-foreground">
          Your account is ready, but you haven&apos;t been added to a cohort yet.
          Once an instructor enrolls you, your tasks, schedule, and progress will
          show up here.
        </p>
      ) : (
        <StudentView dashboard={dashboard} />
      )}
    </PageContainer>
  );
};

export default Page;
