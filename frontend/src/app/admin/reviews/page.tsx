"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";

import { ClickableCard, LoadingState } from "@components/common";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import {
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
} from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import { SUBMISSION_STATUS_FILTER_TABS } from "@constants/submissions";
import { useCohorts } from "@features/cohorts";
import {
  ReviewSheet,
  SubmissionStatusBadge,
  useSubmissions,
  type SubmissionStatusFilter,
} from "@features/submissions";

const Page = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<SubmissionStatusFilter>("submitted");
  const [cohortFilter, setCohortFilter] = useState("all");
  const { data: cohorts = [] } = useCohorts();
  const {
    data: submissions = [],
    isLoading,
    error,
    refetch,
  } = useSubmissions({
    status: statusFilter,
    cohortId: cohortFilter === "all" ? undefined : Number(cohortFilter),
  });
  const selected = submissions.find((s) => s.id === selectedId);

  return (
    <PageContainer>
      <PageHeader
        title="Review Queue"
        description="Review student submissions and leave feedback."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as SubmissionStatusFilter)}
        >
          <TabsList>
            {SUBMISSION_STATUS_FILTER_TABS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select value={cohortFilter} onValueChange={setCohortFilter}>
          <SelectTrigger className="sm:w-48" aria-label="Filter by cohort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cohorts</SelectItem>
            {cohorts.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState message="Loading submissions…" />
      ) : error ? (
        <ErrorState what="submissions" onRetry={refetch} />
      ) : submissions.length === 0 ? (
        <EmptyState message="No submissions in this category." art={APP_ART.reviews} />
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <ClickableCard
              key={sub.id}
              onClick={() => setSelectedId(sub.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {sub.task?.title ?? "Unknown Task"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {sub.user?.name ?? sub.user?.email}
                  {sub.cohort && ` · ${sub.cohort.name}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {/* The list is ordered by the latest send, so show that. */}
                  {format(new Date(sub.lastSubmittedAt), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <SubmissionStatusBadge status={sub.status} showIcon={false} />
                <Button variant="ghost" size="sm">
                  Review
                </Button>
              </div>
            </ClickableCard>
          ))}
        </div>
      )}

      {selected && (
        <ReviewSheet
          submission={selected}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          onReviewed={refetch}
        />
      )}
    </PageContainer>
  );
};

export default Page;
