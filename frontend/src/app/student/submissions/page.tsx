"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock, MessageSquare } from "lucide-react";

import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import {
  StudentSubmissionDetailSheet,
  SubmissionStatusBadge,
  useSubmissions,
} from "@features/submissions";

const StudentSubmissionsPage = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: submissions = [], isLoading } = useSubmissions();
  const selected = submissions.find((s) => s.id === selectedId);

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title="Submissions"
        description="Your submission history and mentor feedback."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Loading submissions…
        </p>
      ) : submissions.length === 0 ? (
        <EmptyState message="No submissions yet. Head to Tasks to start submitting your work." />
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <Card
              key={sub.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedId(sub.id)}
            >
              <div className="flex items-center gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {sub.task?.title ?? "Unknown Task"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Submitted{" "}
                    {format(new Date(sub.createdAt), "MMM d, yyyy")}
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
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <StudentSubmissionDetailSheet
          submission={selected}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </PageContainer>
  );
};

export default StudentSubmissionsPage;
