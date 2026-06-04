"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  DetailField,
  DetailGrid,
  FormBody,
  FormDialog,
  FormField,
  ProseBlock,
  SectionTitle,
} from "@components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { APPLICATION_STATUS_OPTIONS } from "@constants/applications";
import { useCohorts } from "@features/cohorts";
import { useUpdateApplicationStatus } from "../hooks";
import type { Application, ApplicationStatus } from "@types";

export type DetailDialogProps = {
  application: Application;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const DetailDialog = ({
  application,
  open,
  onOpenChange,
}: DetailDialogProps) => {
  const { data: cohorts = [] } = useCohorts();
  const { update, isPending } = useUpdateApplicationStatus();

  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [reviewerNote, setReviewerNote] = useState(
    application.reviewerNote ?? "",
  );
  const [cohortId, setCohortId] = useState<string>(
    application.cohortId?.toString() ?? "",
  );

  const handleSave = async () => {
    try {
      await update(application.id, {
        status,
        reviewerNote: reviewerNote || null,
        cohortId:
          status === "accepted" && cohortId
            ? Number.parseInt(cohortId, 10)
            : null,
      });
      toast.success("Application updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update application");
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${application.firstName} ${application.lastName}`}
      size="lg"
      actions={{
        onSubmit: handleSave,
        submitLabel: "Save",
        isLoading: isPending,
      }}
    >
      <FormBody className="space-y-5">
        <DetailGrid>
          <DetailField label="Email" value={application.email} />
          <DetailField
            label="Applied"
            value={format(new Date(application.createdAt), "MMM d, yyyy")}
          />
        </DetailGrid>

        {application.motivation && (
          <div>
            <SectionTitle className="mb-1">Motivation</SectionTitle>
            <ProseBlock>{application.motivation}</ProseBlock>
          </div>
        )}

        {application.background && (
          <div>
            <SectionTitle className="mb-1">Background</SectionTitle>
            <ProseBlock>{application.background}</ProseBlock>
          </div>
        )}

        {application.experience && (
          <div>
            <SectionTitle className="mb-1">Experience</SectionTitle>
            <ProseBlock>{application.experience}</ProseBlock>
          </div>
        )}

        {(application.linkedin ||
          application.github ||
          application.twitter ||
          application.facebook ||
          application.portfolio) && (
          <div>
            <SectionTitle className="mb-2">Social Profiles</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "linkedin", label: "LinkedIn" },
                  { key: "github", label: "GitHub" },
                  { key: "twitter", label: "Twitter" },
                  { key: "facebook", label: "Facebook" },
                  { key: "portfolio", label: "Portfolio" },
                ] as const
              )
                .filter(({ key }) => !!application[key])
                .map(({ key, label }) => (
                  <a
                    key={key}
                    href={application[key]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    {label}
                  </a>
                ))}
            </div>
          </div>
        )}

        <FormField label="Status">
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ApplicationStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUS_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {status === "accepted" && cohorts.length > 0 && (
          <FormField label="Assign to Cohort">
            <Select value={cohortId} onValueChange={setCohortId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a cohort..." />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}

        <FormField label="Reviewer Note">
          <Textarea
            placeholder="Internal notes about this application..."
            rows={3}
            value={reviewerNote}
            onChange={(e) => setReviewerNote(e.target.value)}
          />
        </FormField>
      </FormBody>
    </FormDialog>
  );
};
