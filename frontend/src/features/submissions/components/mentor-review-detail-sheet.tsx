"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
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
import { Textarea } from "@components/ui/textarea";
import { useSubmissionFeedback } from "@features/submissions/hooks";
import { SubmissionStatusBadge } from "@features/submissions/components/submission-status-badge";
import type { FeedbackVerdict, Submission } from "@types";

export type MentorReviewDetailSheetProps = {
  submission: Submission;
  open: boolean;
  onClose: () => void;
};

export const MentorReviewDetailSheet = ({
  submission,
  open,
  onClose,
}: MentorReviewDetailSheetProps) => {
  const { data: feedback = [] } = useSubmissionFeedback(
    open ? submission.id : null,
  );
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
        <SheetHeader>
          <SheetTitle className="text-xl">
            {submission.task?.title}
          </SheetTitle>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-muted-foreground">
              By {submission.user?.name ?? submission.user?.email}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(submission.createdAt), "MMM d, yyyy")}
            </span>
            <SubmissionStatusBadge
              status={submission.status}
              showIcon={false}
            />
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
              <h3 className="text-sm font-semibold mb-2">Student Write-up</h3>
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
                          fb.verdict === "approved" ? "default" : "destructive"
                        }
                        className="text-xs"
                      >
                        {fb.verdict === "approved" ? "Approved" : "Needs Work"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{fb.content}</p>
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
      </SheetContent>
    </Sheet>
  );
};
