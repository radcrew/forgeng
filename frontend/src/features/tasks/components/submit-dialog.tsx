"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { FormBody, FormDialog, FormField } from "@components/common";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import {
  createSubmission,
  validateSubmission,
  type Submission,
  type SubmissionErrors,
} from "@features/submissions";
import { ApiError } from "@lib/api-client";
import type { Task } from "@types";

export type TaskSubmitDialogProps = {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called with the new submission, so the page can show it right away
   * instead of offering Submit again while it reloads.
   */
  onSubmitted?: (submission: Submission) => void;
};

export const TaskSubmitDialog = ({
  task,
  open,
  onOpenChange,
  onSubmitted,
}: TaskSubmitDialogProps) => {
  const [content, setContent] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [errors, setErrors] = useState<SubmissionErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Blocks a second send before the disabled button has re-rendered.
  const sending = useRef(false);

  const handleSubmit = async () => {
    const found = validateSubmission({ repoUrl, content });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (sending.current) return;
    sending.current = true;
    setIsSubmitting(true);
    try {
      const submission = await createSubmission(task.id, {
        content: content.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
      });
      toast.success("Submission sent!", {
        description: "Your work has been submitted for review.",
      });
      onOpenChange(false);
      setContent("");
      setRepoUrl("");
      onSubmitted?.(submission);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to submit your work.",
      );
    } finally {
      sending.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Submit: ${task.title}`}
      size="lg"
      actions={{
        onSubmit: handleSubmit,
        submitLabel: "Submit Work",
        loadingLabel: "Submitting...",
        isLoading: isSubmitting,
      }}
    >
      <FormBody>
        <FormField
          label="Repository URL (optional)"
          htmlFor="repoUrl"
          error={errors.repoUrl}
        >
          <Input
            id="repoUrl"
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
          htmlFor="content"
          error={errors.content}
        >
          <Textarea
            id="content"
            placeholder="Describe your solution, approach, or any notes for the reviewer..."
            rows={5}
            value={content}
            aria-invalid={!!errors.content}
            onChange={(e) => {
              setContent(e.target.value);
              setErrors({});
            }}
          />
        </FormField>
      </FormBody>
    </FormDialog>
  );
};
