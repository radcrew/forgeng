"use client";

import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

import {
  DetailSheet as BaseDetailSheet,
  ExternalLinkField,
  FeedbackCard,
  ProseBlock,
  SectionTitle,
} from "@components/common";
import { Separator } from "@components/ui/separator";
import type { Submission } from "@types";

import { useSubmissionFeedback } from "../../hooks";
import { StatusBadge } from "../status-badge";

export type DetailSheetProps = {
  submission: Submission;
  open: boolean;
  onClose: () => void;
};

export const DetailSheet = ({
  submission,
  open,
  onClose,
}: DetailSheetProps) => {
  const { data: feedback = [] } = useSubmissionFeedback(
    open ? submission.id : null,
  );

  return (
    <BaseDetailSheet
      open={open}
      onClose={onClose}
      title={submission.task?.title ?? "Submission"}
      subtitle={
        <div className="flex items-center gap-2">
          <StatusBadge status={submission.status} />
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
          Mentor Feedback ({feedback.length})
        </SectionTitle>
        {feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No feedback yet. Check back after a mentor reviews your submission.
          </p>
        ) : (
          <div className="space-y-4">
            {feedback.map((fb) => (
              <FeedbackCard
                key={fb.id}
                authorName={fb.mentor?.name ?? "Mentor"}
                verdict={fb.verdict}
                content={fb.content}
                createdAt={fb.createdAt}
              />
            ))}
          </div>
        )}
      </div>
    </BaseDetailSheet>
  );
};
