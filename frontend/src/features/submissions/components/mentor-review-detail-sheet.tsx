"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  DetailSheet,
  ExternalLinkField,
  FeedbackCard,
  FormField,
  ProseBlock,
  SectionTitle,
  VerdictPicker,
} from "@components/common";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { Textarea } from "@components/ui/textarea";
import type { FeedbackVerdict, Submission } from "@types";

import { useSubmissionFeedback } from "../hooks";
import { SubmissionStatusBadge } from "./submission-status-badge";

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
    <DetailSheet
      open={open}
      onClose={onClose}
      title={submission.task?.title ?? "Review"}
      size="md"
      subtitle={
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            By {submission.user?.name ?? submission.user?.email}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">
            {format(new Date(submission.createdAt), "MMM d, yyyy")}
          </span>
          <SubmissionStatusBadge status={submission.status} showIcon={false} />
        </div>
      }
    >
      {submission.repoUrl && <ExternalLinkField href={submission.repoUrl} />}

      {submission.content && (
        <div>
          <SectionTitle>Student Write-up</SectionTitle>
          <ProseBlock className="p-4">{submission.content}</ProseBlock>
        </div>
      )}

      <Separator />

      {feedback.length > 0 && (
        <div className="space-y-3">
          <SectionTitle>Previous Feedback</SectionTitle>
          {feedback.map((fb) => (
            <FeedbackCard
              key={fb.id}
              authorName={fb.mentor?.name ?? "You"}
              verdict={fb.verdict}
              content={fb.content}
              createdAt={fb.createdAt}
            />
          ))}
        </div>
      )}

      {submission.status === "submitted" && (
        <div className="space-y-4">
          <SectionTitle>Leave Feedback</SectionTitle>
          <VerdictPicker value={verdict} onChange={setVerdict} />
          <FormField label="Feedback" htmlFor="feedback">
            <Textarea
              id="feedback"
              placeholder="Write your feedback for the student..."
              rows={5}
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
            />
          </FormField>
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
    </DetailSheet>
  );
};
