"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { PageContainer, PageHeader } from "@components/shared";
import {
  CohortSwitcher,
  StudentOnboarding,
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

      {profileIncomplete && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Your profile is incomplete. Please{" "}
            <Link
              href="/student/profile"
              className="font-medium underline underline-offset-2 hover:no-underline"
            >
              complete all profile fields
            </Link>{" "}
            to take part in a cohort and receive tasks.
          </p>
        </div>
      )}

      {cohort ? (
        <StudentView dashboard={dashboard} />
      ) : (
        <StudentOnboarding name={user?.name} />
      )}
    </PageContainer>
  );
};

export default Page;
