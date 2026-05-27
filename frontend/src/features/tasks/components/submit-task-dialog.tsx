"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormBody, FormDialog, FormField } from "@components/common";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import type { Task } from "@types";

export type SubmitTaskDialogProps = {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SubmitTaskDialog = ({
  task,
  open,
  onOpenChange,
}: SubmitTaskDialogProps) => {
  const [content, setContent] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitting(false);
    toast.success("Submission sent!", {
      description: "Your work has been submitted for review.",
    });
    onOpenChange(false);
    setContent("");
    setRepoUrl("");
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
        <FormField label="Repository URL (optional)" htmlFor="repoUrl">
          <Input
            id="repoUrl"
            placeholder="https://github.com/you/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </FormField>
        <FormField label="Notes / Write-up (optional)" htmlFor="content">
          <Textarea
            id="content"
            placeholder="Describe your solution, approach, or any notes for the reviewer..."
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </FormField>
      </FormBody>
    </FormDialog>
  );
};
