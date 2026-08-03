"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";

import { ClickableCard, LoadingState } from "@components/common";
import { Button } from "@components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import { SUBMISSION_STATUS_FILTER_TABS } from "@constants/submissions";
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
  const { data: submissions = [], isLoading, refetch } = useSubmissions({
    status: statusFilter,
  });
  const selected = submissions.find((s) => s.id === selectedId);

  return (
    <PageContainer>
      <PageHeader
        title="Review Queue"
        description="Review student submissions and leave feedback."
      />

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

      {isLoading ? (
        <LoadingState message="Loading submissions…" />
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
                <p className="text-sm text-muted-foreground mt-0.5">
                  {sub.user?.name ?? sub.user?.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(sub.createdAt), "MMM d, yyyy")}
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
