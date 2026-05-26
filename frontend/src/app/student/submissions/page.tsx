"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCurrentUser } from "@/lib/auth";
import { mockFeedback, mockSubmissions } from "@/lib/mock-data";

function SubmissionDetail({
  submissionId,
  open,
  onClose,
}: {
  submissionId: number;
  open: boolean;
  onClose: () => void;
}) {
  const submission = mockSubmissions.find((s) => s.id === submissionId);
  const feedback = mockFeedback.filter((f) => f.submissionId === submissionId);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        {!submission ? null : (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl">{submission.task?.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    submission.status === "approved"
                      ? "default"
                      : submission.status === "needs_work"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {submission.status === "approved" && (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  )}
                  {submission.status === "needs_work" && (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {submission.status.replace("_", " ")}
                </Badge>
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
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function StudentSubmissionsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { user } = useCurrentUser();
  const currentUserId = user?.id;
  const submissions = useMemo(
    () =>
      currentUserId == null
        ? []
        : mockSubmissions.filter((s) => s.user?.id === currentUserId),
    [currentUserId],
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
        <p className="text-muted-foreground mt-1">
          Your submission history and mentor feedback.
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            No submissions yet. Head to Tasks to start submitting your work.
          </CardContent>
        </Card>
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
                  <Badge
                    variant={
                      sub.status === "approved"
                        ? "default"
                        : sub.status === "needs_work"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {sub.status === "approved" && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {sub.status === "needs_work" && (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {sub.status.replace("_", " ")}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedId && (
        <SubmissionDetail
          submissionId={selectedId}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
