"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  FormBody,
  FormDialog,
  FormField,
  FormGrid,
} from "@components/common";
import { COHORT_STATUS_OPTIONS } from "@constants/cohorts";
import { Input } from "@components/ui/input";
import { DateInput } from "@components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { ApiError } from "@lib/api-client";
import { createCohort, updateCohort } from "../api";
import { validateCohort, type CohortErrors } from "../validation";
import type { Cohort, CohortStatus } from "@types";

export type CohortFormDialogProps = {
  cohort?: Cohort;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

export const CohortFormDialog = ({
  cohort,
  open,
  onOpenChange,
  onSaved,
}: CohortFormDialogProps) => {
  const isEdit = !!cohort;
  const [name, setName] = useState(cohort?.name ?? "");
  const [description, setDescription] = useState(cohort?.description ?? "");
  const [capacity, setCapacity] = useState(cohort?.capacity?.toString() ?? "20");
  const [status, setStatus] = useState<CohortStatus>(cohort?.status ?? "draft");
  const [startDate, setStartDate] = useState(
    cohort?.startDate?.slice(0, 10) ?? "",
  );
  const [endDate, setEndDate] = useState(cohort?.endDate?.slice(0, 10) ?? "");
  const [slackChannelId, setSlackChannelId] = useState(
    cohort?.slackChannelId ?? "",
  );
  const [errors, setErrors] = useState<CohortErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const found = validateCohort(
      {
        name,
        description: description ?? "",
        capacity,
        startDate,
        endDate,
        slackChannelId,
      },
      cohort?.enrolledCount ?? 0,
    );
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        // Send null (not undefined) so clearing the field persists — Prisma
        // treats undefined as "leave unchanged", so an empty description would
        // otherwise never be saved.
        description: description || null,
        capacity: Number(capacity),
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        // null, like the description, so clearing the field is saved.
        slackChannelId: slackChannelId.trim() || null,
      };
      if (isEdit) {
        await updateCohort(cohort.id, payload);
      } else {
        await createCohort(payload);
      }
      toast.success(isEdit ? "Cohort updated" : "Cohort created");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not save cohort. Please try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Cohort" : "Create Cohort"}
      actions={{
        onSubmit: handleSave,
        submitLabel: isEdit ? "Save Changes" : "Create",
        isLoading: isSaving,
        submitDisabled: !name.trim(),
      }}
    >
      <FormBody>
        <FormField label="Name" htmlFor="cohort-name" error={errors.name}>
          <Input
            id="cohort-name"
            value={name}
            aria-invalid={!!errors.name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors({});
            }}
            placeholder="e.g. Spring 2026 Cohort"
          />
        </FormField>
        <FormField
          label="Description"
          htmlFor="cohort-description"
          error={errors.description}
        >
          <Textarea
            id="cohort-description"
            value={description ?? ""}
            aria-invalid={!!errors.description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors({});
            }}
            rows={3}
          />
        </FormField>
        <FormGrid>
          <FormField
            label="Capacity"
            htmlFor="cohort-capacity"
            error={errors.capacity}
          >
            <Input
              id="cohort-capacity"
              type="number"
              min="1"
              step="1"
              value={capacity}
              aria-invalid={!!errors.capacity}
              onChange={(e) => {
                setCapacity(e.target.value);
                setErrors({});
              }}
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as CohortStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COHORT_STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormGrid>
        <FormGrid>
          <FormField label="Start Date">
            <DateInput
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setErrors({});
              }}
            />
          </FormField>
          <FormField label="End Date" error={errors.endDate}>
            <DateInput
              value={endDate}
              min={startDate || undefined}
              aria-invalid={!!errors.endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setErrors({});
              }}
            />
          </FormField>
        </FormGrid>
        <FormField
          label="Slack channel ID (optional)"
          htmlFor="cohort-slack-channel"
          error={errors.slackChannelId}
        >
          <Input
            id="cohort-slack-channel"
            value={slackChannelId}
            aria-invalid={!!errors.slackChannelId}
            onChange={(e) => {
              setSlackChannelId(e.target.value);
              setErrors({});
            }}
            placeholder="e.g. C0123ABCD"
          />
          <p className="text-xs text-muted-foreground">
            {isEdit
              ? "New tasks are posted to this channel. In Slack, open the channel details: the ID is at the bottom. Invite the Forgeng app to the channel too."
              : "Leave it empty to create a private Slack channel for this cohort automatically. To use a channel you already have, paste its ID: in Slack, open the channel details, and the ID is at the bottom."}
          </p>
        </FormField>
      </FormBody>
    </FormDialog>
  );
};
