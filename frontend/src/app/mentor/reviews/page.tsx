"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Textarea } from "@components/ui/textarea";
import { mockFeedback, mockSubmissions } from "@lib/mock-data";
import type { FeedbackVerdict, SubmissionStatus } from "@lib/types";

type StatusFilter = SubmissionStatus | "all";

function ReviewDetail({
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
  const [feedbackContent, setFeedbackContent] = useState("");
  const [verdict, setVerdict] = useState<FeedbackVerdict>("approved");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitting(false);
    toast.success("Feedback submitted!");
    setFeedbackContent("");
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent className="sm:max-w-[580px] overflow-y-auto">
        {!submission ? null : (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl">{submission.task?.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  By {submission.user?.name ?? submission.user?.email}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(submission.createdAt), "MMM d, yyyy")}
                </span>
                <Badge
                  variant={
                    submission.status === "approved"
                      ? "default"
                      : submission.status === "needs_work"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {submission.status.replace("_", " ")}
                </Badge>
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
                  <h3 className="text-sm font-semibold mb-2">
                    Student Write-up
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-4">
                    {submission.content}
                  </p>
                </div>
              )}

              <Separator />

              {feedback.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Previous Feedback</h3>
                  {feedback.map((fb) => (
                    <Card
                      key={fb.id}
                      className={
                        fb.verdict === "approved"
                          ? "border-primary/40"
                          : "border-destructive/40"
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {fb.mentor?.name ?? "You"}
                          </span>
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
                        <p className="text-sm text-muted-foreground">
                          {fb.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {submission.status === "submitted" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Leave Feedback</h3>
                  <div className="flex gap-3">
                    <Button
                      variant={verdict === "approved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVerdict("approved")}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant={
                        verdict === "needs_work" ? "destructive" : "outline"
                      }
                      size="sm"
                      onClick={() => setVerdict("needs_work")}
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Needs Work
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Write your feedback for the student..."
                      rows={5}
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackContent.trim() || isSubmitting}
                    className="w-full"
                    variant={verdict === "needs_work" ? "destructive" : "default"}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : `Submit — ${verdict === "approved" ? "Approved" : "Needs Work"}`}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function MentorReviewsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");

  const submissions = useMemo(() => {
    if (statusFilter === "all") return mockSubmissions;
    return mockSubmissions.filter((s) => s.status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review student submissions and leave feedback.
        </p>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="submitted">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="needs_work">Needs Work</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {submissions.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            No submissions in this category.
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
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {sub.user?.name ?? sub.user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(sub.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant={
                      sub.status === "approved"
                        ? "default"
                        : sub.status === "needs_work"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {sub.status.replace("_", " ")}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedId && (
        <ReviewDetail
          submissionId={selectedId}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
