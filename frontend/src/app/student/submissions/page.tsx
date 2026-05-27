"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock, ExternalLink, MessageSquare } from "lucide-react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import {
  SubmissionStatusBadge,
  useSubmissionFeedback,
  useSubmissions,
  type Submission,
} from "@features/submissions";
import { useCurrentUser } from "@lib/auth";

function SubmissionDetail({
  submission,
  open,
  onClose,
}: {
  submission: Submission;
  open: boolean;
  onClose: () => void;
}) {
  const { data: feedback = [] } = useSubmissionFeedback(
    open ? submission.id : null,
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <>
          <SheetHeader>
            <SheetTitle className="text-xl">{submission.task?.title}</SheetTitle>
            <div className="flex items-center gap-2 mt-1">
              <SubmissionStatusBadge status={submission.status} />
                <span className="text-sm text-muted-foreground">
                  Submitted{" "}
                  {format(new Date(submission.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {submission.repoUrl && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Repository</h3>
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {submission.repoUrl}
                  </a>
                </div>
              )}

              {submission.content && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Write-up</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-4">
                    {submission.content}
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Mentor Feedback ({feedback.length})
                </h3>
                {feedback.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No feedback yet. Check back after a mentor reviews your
                    submission.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {feedback.map((fb) => (
                      <Card
                        key={fb.id}
                        className={
                          fb.verdict === "approved"
                            ? "border-primary/40"
                            : "border-destructive/40"
                        }
                      >
                        <CardHeader className="pb-2 pt-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                              {fb.mentor?.name ?? "Mentor"}
                            </CardTitle>
                            <Badge
                              variant={
                                fb.verdict === "approved"
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {fb.verdict === "approved"
                                ? "Approved"
                                : "Needs Work"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground">
                            {fb.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(fb.createdAt), "MMM d, yyyy")}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </>
      </SheetContent>
    </Sheet>
  );
}

export default function StudentSubmissionsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { user } = useCurrentUser();
  const { data: submissions = [], isLoading } = useSubmissions({
    userId: user?.id,
  });
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
        <SubmissionDetail
          submission={selected}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </PageContainer>
  );
}
