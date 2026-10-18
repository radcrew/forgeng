"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

import {
  DetailSheet,
  ExternalLinkField,
  FeedbackCard,
  FormField,
  ProseBlock,
  SectionTitle,
} from "@components/common";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";
import { Skeleton } from "@components/ui/skeleton";
import { ErrorState } from "@components/shared";
import { Textarea } from "@components/ui/textarea";
import { ApiError } from "@lib/api-client";
import type { Submission } from "@types";

import { resubmitSubmission } from "../../api";
import { useSubmissionFeedback } from "../../hooks";
import { formatSentDates } from "../../sent-dates";
import { validateSubmission, type SubmissionErrors } from "../../validation";
import { SubmissionStatusBadge } from "../status-badge";

export type SubmissionDetailSheetProps = {
  submission: Submission;
  open: boolean;
  onClose: () => void;
  /** Called after a successful resubmission so the caller can refetch. */
  onResubmitted?: () => void;
  /** Off on the task page itself, where the link would lead back to it. */
  showTaskLink?: boolean;
  /**
   * The submission's cohort has ended, so resubmitting isn't possible.
   * Required on purpose: a caller that left it out would show a resubmit
   * form that the server then refuses.
   */
  cohortEnded: boolean;
};

export const SubmissionDetailSheet = ({
  submission,
  open,
  onClose,
  onResubmitted,
  showTaskLink = true,
  cohortEnded,
}: SubmissionDetailSheetProps) => {
  const {
    data: feedback = [],
    isLoading: feedbackLoading,
    error: feedbackError,
    refetch: refetchFeedback,
  } = useSubmissionFeedback(open ? submission.id : null);

  const [content, setContent] = useState(submission.content ?? "");
  const [repoUrl, setRepoUrl] = useState(submission.repoUrl ?? "");
  const [errors, setErrors] = useState<SubmissionErrors>({});
  const [isResubmitting, setIsResubmitting] = useState(false);
  // Blocks a second send before the disabled button has re-rendered.
  const sending = useRef(false);

  const handleResubmit = async () => {
    const found = validateSubmission({ repoUrl, content });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (sending.current) return;
    sending.current = true;
    setIsResubmitting(true);
    try {
      // Send null (not undefined) so a cleared field is removed. The server
      // treats a missing field as "keep the old value".
      await resubmitSubmission(submission.id, {
        content: content.trim() || null,
        repoUrl: repoUrl.trim() || null,
      });
      toast.success("Resubmitted!", {
        description: "Your revised work is back in the review queue.",
      });
      onResubmitted?.();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to resubmit your work.",
      );
    } finally {
      sending.current = false;
      setIsResubmitting(false);
    }
  };

  return (
    <DetailSheet
      open={open}
      onClose={onClose}
      title={submission.task?.title ?? "Submission"}
      subtitle={
        <div className="flex items-center gap-2">
          <SubmissionStatusBadge status={submission.status} />
          <span className="text-sm text-muted-foreground">
            {formatSentDates(submission)}
          </span>
          {showTaskLink && (
            <Link
              href={`/student/tasks/${submission.taskId}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View task
            </Link>
          )}
        </div>
      }
    >
      {submission.repoUrl && <ExternalLinkField href={submission.repoUrl} />}

      {submission.content && (
        <div>
          <SectionTitle>Write-up</SectionTitle>
          <ProseBlock className="p-4">{submission.content}</ProseBlock>
        </div>
      )}

      <Separator />

      <div>
        <SectionTitle className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Feedback
          {!feedbackLoading && !feedbackError && ` (${feedback.length})`}
        </SectionTitle>
        {/* "No feedback yet" only once we know there is none, not while it
            loads or after it failed to load. */}
        {feedbackLoading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <Skeleton
                key={i}
                className="h-24 w-full rounded-lg"
                data-testid="feedback-placeholder"
              />
            ))}
          </div>
        ) : feedbackError ? (
          <ErrorState
            what="the feedback"
            onRetry={refetchFeedback}
            size="compact"
          />
        ) : feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No feedback yet. Check back after your submission is reviewed.
          </p>
        ) : (
          <div className="space-y-4">
            {feedback.map((fb) => (
              <FeedbackCard
                key={fb.id}
                authorName={fb.reviewer?.name ?? "Reviewer"}
                verdict={fb.verdict}
                content={fb.content}
                createdAt={fb.createdAt}
              />
            ))}
          </div>
        )}
      </div>

      {/* The server refuses resubmits once the cohort has ended, so say so
          instead of showing a form that can only fail. */}
      {submission.status === "needs_work" && cohortEnded && (
        <>
          <Separator />
          <p className="text-sm text-muted-foreground">
            This cohort has ended, so it no longer accepts resubmissions.
          </p>
        </>
      )}

      {submission.status === "needs_work" && !cohortEnded && (
        <>
          <Separator />
          <div className="space-y-4">
            <SectionTitle>Revise & Resubmit</SectionTitle>
            <FormField
              label="Repository URL (optional)"
              htmlFor="resubmit-repo"
              error={errors.repoUrl}
            >
              <Input
                id="resubmit-repo"
                placeholder="https://github.com/you/repo"
                value={repoUrl}
                aria-invalid={!!errors.repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  setErrors({});
                }}
              />
            </FormField>
            <FormField
              label="Notes / Write-up (optional)"
              htmlFor="resubmit-content"
              error={errors.content}
            >
              <Textarea
                id="resubmit-content"
                placeholder="Describe what you changed since the last review..."
                rows={5}
                value={content}
                aria-invalid={!!errors.content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setErrors({});
                }}
              />
            </FormField>
            <Button
              onClick={handleResubmit}
              disabled={isResubmitting}
              className="w-full"
            >
              {isResubmitting ? "Resubmitting..." : "Resubmit for Review"}
            </Button>
          </div>
        </>
      )}
    </DetailSheet>
  );
};
