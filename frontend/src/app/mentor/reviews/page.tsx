"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";

import { ClickableCard, LoadingState } from "@components/common";
import { Button } from "@components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import {
  MentorReviewDetailSheet,
  SubmissionStatusBadge,
  useSubmissions,
  type SubmissionStatusFilter,
} from "@features/submissions";

const MentorReviewsPage = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<SubmissionStatusFilter>("submitted");
  const { data: submissions = [], isLoading } = useSubmissions({
    status: statusFilter,
  });
  const selected = submissions.find((s) => s.id === selectedId);

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title="Review Queue"
        description="Review student submissions and leave feedback."
      />

      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as SubmissionStatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="submitted">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="needs_work">Needs Work</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <LoadingState message="Loading submissions…" />
      ) : submissions.length === 0 ? (
        <EmptyState message="No submissions in this category." />
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
        <MentorReviewDetailSheet
          submission={selected}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </PageContainer>
  );
};

export default MentorReviewsPage;
