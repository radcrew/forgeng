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
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name) return;
    setIsSaving(true);
    try {
      const payload = {
        name,
        // Send null (not undefined) so clearing the field persists — Prisma
        // treats undefined as "leave unchanged", so an empty description would
        // otherwise never be saved.
        description: description || null,
        capacity: Number(capacity),
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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
        submitDisabled: !name,
      }}
    >
      <FormBody>
        <FormField label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spring 2026 Cohort"
          />
        </FormField>
        <FormField label="Description">
          <Textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </FormField>
        <FormGrid>
          <FormField label="Capacity">
            <Input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
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
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>
          <FormField label="End Date">
            <DateInput
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormField>
        </FormGrid>
      </FormBody>
    </FormDialog>
  );
};
