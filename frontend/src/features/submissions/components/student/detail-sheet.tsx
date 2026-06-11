"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { Textarea } from "@components/ui/textarea";
import { ApiError } from "@lib/api-client";
import type { Submission } from "@types";

import { resubmitSubmission } from "../../api";
import { useSubmissionFeedback } from "../../hooks";
import { SubmissionStatusBadge } from "../status-badge";

export type SubmissionDetailSheetProps = {
  submission: Submission;
  open: boolean;
  onClose: () => void;
  /** Called after a successful resubmission so the caller can refetch. */
  onResubmitted?: () => void;
};

export const SubmissionDetailSheet = ({
  submission,
  open,
  onClose,
  onResubmitted,
}: SubmissionDetailSheetProps) => {
  const { data: feedback = [] } = useSubmissionFeedback(
    open ? submission.id : null,
  );

  const [content, setContent] = useState(submission.content ?? "");
  const [repoUrl, setRepoUrl] = useState(submission.repoUrl ?? "");
  const [isResubmitting, setIsResubmitting] = useState(false);

  const handleResubmit = async () => {
    setIsResubmitting(true);
    try {
      await resubmitSubmission(submission.id, {
        content: content.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
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
            Submitted {format(new Date(submission.createdAt), "MMM d, yyyy")}
          </span>
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
          Feedback ({feedback.length})
        </SectionTitle>
        {feedback.length === 0 ? (
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

      {submission.status === "needs_work" && (
        <>
          <Separator />
          <div className="space-y-4">
            <SectionTitle>Revise & Resubmit</SectionTitle>
            <FormField label="Repository URL (optional)" htmlFor="resubmit-repo">
              <Input
                id="resubmit-repo"
                placeholder="https://github.com/you/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </FormField>
            <FormField label="Notes / Write-up (optional)" htmlFor="resubmit-content">
              <Textarea
                id="resubmit-content"
                placeholder="Describe what you changed since the last review..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
