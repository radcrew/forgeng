"use client";

import { ErrorState, PageContainer, PageHeader } from "@components/shared";
import {
  AwaitingCohort,
  CohortSwitcher,
  ProfileReminder,
  StudentView,
  useStudentDashboard,
} from "@features/dashboard";
import { UpcomingMeetingsCard } from "@features/meetings";
import { MentorBookingCard } from "@features/mentors";
import { useCurrentUser, useSelectedCohort } from "@contexts";
import { isProfileComplete } from "@utils/user";

const Page = () => {
  const { selectedCohortId } = useSelectedCohort();
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useStudentDashboard(selectedCohortId);
  const { user } = useCurrentUser();

  // Keep the stale dashboard on screen while switching cohorts so the page
  // (and the switcher) don't flash back to the loading state.
  if (!dashboard) {
    return (
      <PageContainer spacing="8">
        <PageHeader
          title="Student Dashboard"
          description={error ? undefined : "Loading…"}
        />
        {error && <ErrorState what="your dashboard" onRetry={refetch} />}
      </PageContainer>
    );
  }

  const { cohort, cohorts } = dashboard;

  const profileIncomplete = user && !isProfileComplete(user);

  return (
    <PageContainer spacing="8">
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

      {/* An incomplete profile only takes over the page before enrollment.
          Once the student has a cohort, a reminder sits above the dashboard
          so their tasks stay visible. */}
      {!cohort ? (
        <AwaitingCohort profileIncomplete={!!profileIncomplete} />
      ) : (
        <>
          {profileIncomplete && <ProfileReminder />}
          <StudentView dashboard={dashboard} />
        </>
      )}

      {/* Also before enrollment: a student waiting for a cohort can talk to
          a mentor too. */}
      <UpcomingMeetingsCard />
      <MentorBookingCard />
    </PageContainer>
  );
};

export default Page;
