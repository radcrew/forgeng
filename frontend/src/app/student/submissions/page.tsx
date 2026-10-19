"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  Search,
} from "lucide-react";

import { ClickableCard, LoadingState } from "@components/common";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import {
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
} from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import { STUDENT_SUBMISSION_FILTER_TABS } from "@constants/submissions";
import { useSelectedCohort } from "@contexts";
import { CohortSwitcher, useStudentDashboard } from "@features/dashboard";
import {
  SubmissionDetailSheet,
  SubmissionStatusBadge,
  filterSubmissions,
  formatSentDates,
  useSubmissions,
} from "@features/submissions";
import type { SubmissionStatusFilter } from "@types";

const PAGE_SIZE = 20;

const Page = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState<SubmissionStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // Follow the same cohort as the Tasks page: the one the student picked, or
  // their default cohort when they haven't picked one.
  const { selectedCohortId } = useSelectedCohort();
  const {
    data: loadedDashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useStudentDashboard(selectedCohortId);
  // After a cohort switch the hook keeps the old cohort's dashboard until the
  // new one arrives. Don't treat it as current, or the page shows the old
  // cohort's name and list, and the old "cohort ended" state.
  const dashboard = dashboardLoading ? undefined : loadedDashboard;
  const {
    data: submissions = [],
    isLoading: submissionsLoading,
    error: submissionsError,
    refetch,
  } = useSubmissions({
    cohortId: dashboard?.cohort?.id,
    // Wait for the dashboard, which says which cohort to show. Loading
    // before that fetched every cohort's submissions only to throw them away.
    enabled: !!dashboard,
  });
  const isLoading = (!dashboard && !dashboardError) || submissionsLoading;
  const error = dashboardError ?? submissionsError;
  const retry = dashboardError ? refetchDashboard : refetch;
  const selected = submissions.find((s) => s.id === selectedId);

  const matching = filterSubmissions(submissions, status, search);
  const totalPages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  // A shorter result after a resubmit must not leave an empty page.
  const currentPage = Math.min(page, totalPages);
  const visible = matching.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <PageContainer>
      <PageHeader
        title="Submissions"
        description={
          dashboard?.cohort
            ? `${dashboard.cohort.name} — your submission history and feedback.`
            : "Your submission history and feedback."
        }
        actions={
          // The switcher stays on screen during a switch, but locked.
          loadedDashboard?.cohort && (
            <CohortSwitcher
              cohorts={loadedDashboard.cohorts}
              activeCohortId={loadedDashboard.cohort.id}
              disabled={dashboardLoading || submissionsLoading}
            />
          )
        }
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
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by task title..."
              aria-label="Search submissions by task title"
              className="pl-9"
            />
          </div>
          <Tabs
            value={status}
            onValueChange={(v) => {
              setStatus(v as SubmissionStatusFilter);
              setPage(1);
            }}
          >
            <TabsList>
              {STUDENT_SUBMISSION_FILTER_TABS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {!isLoading &&
        !error &&
        submissions.length > 0 &&
        (matching.length === 0 ? (
          <EmptyState
            message="No submissions match these filters."
            art={APP_ART.noResults}
          />
        ) : (
          <div className="space-y-3">
            {visible.map((sub) => (
              <ClickableCard key={sub.id} onClick={() => setSelectedId(sub.id)}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {sub.task?.title ?? "Unknown Task"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatSentDates(sub)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {sub.feedbackCount > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" aria-hidden="true" />
                      {sub.feedbackCount}
                      {/* Screen readers would otherwise read only the number. */}
                      <span className="sr-only">
                        {sub.feedbackCount === 1
                          ? " feedback comment"
                          : " feedback comments"}
                      </span>
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
        ))}

      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selected && !isLoading && (
        <SubmissionDetailSheet
          submission={selected}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          onResubmitted={refetch}
          // From the submission's own cohort. A student with no current
          // cohort sees work from every cohort, so the dashboard can't say.
          cohortEnded={selected.cohortEnded}
        />
      )}
    </PageContainer>
  );
};

export default Page;
