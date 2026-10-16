"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock, MessageSquare } from "lucide-react";

import { ClickableCard, LoadingState } from "@components/common";
import { Button } from "@components/ui/button";
import {
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
} from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import { useSelectedCohort } from "@contexts";
import { useStudentDashboard } from "@features/dashboard";
import {
  SubmissionDetailSheet,
  SubmissionStatusBadge,
  useSubmissions,
} from "@features/submissions";

const Page = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Follow the same cohort as the Tasks page: the one the student picked, or
  // their default cohort when they haven't picked one.
  const { selectedCohortId } = useSelectedCohort();
  const {
    data: dashboard,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useStudentDashboard(selectedCohortId);
  const {
    data: submissions = [],
    isLoading: submissionsLoading,
    error: submissionsError,
    refetch,
  } = useSubmissions({ cohortId: dashboard?.cohort?.id });
  const isLoading = (!dashboard && !dashboardError) || submissionsLoading;
  const error = dashboardError ?? submissionsError;
  const retry = dashboardError ? refetchDashboard : refetch;
  const selected = submissions.find((s) => s.id === selectedId);

  return (
    <PageContainer>
      <PageHeader
        title="Submissions"
        description="Your submission history and feedback."
      />

      {isLoading ? (
        <LoadingState message="Loading submissions…" />
      ) : error ? (
        <ErrorState what="your submissions" onRetry={retry} />
      ) : submissions.length === 0 ? (
        <EmptyState
          message="No submissions yet. Head to Tasks to start submitting your work."
          art={APP_ART.submissions}
        />
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <ClickableCard key={sub.id} onClick={() => setSelectedId(sub.id)}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {sub.task?.title ?? "Unknown Task"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Submitted {format(new Date(sub.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {sub.feedbackCount > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {sub.feedbackCount}
                  </span>
                )}
                <SubmissionStatusBadge status={sub.status} />
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            </ClickableCard>
          ))}
        </div>
      )}

      {selected && (
        <SubmissionDetailSheet
          submission={selected}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          onResubmitted={refetch}
        />
      )}
    </PageContainer>
  );
};

export default Page;
