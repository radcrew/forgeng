"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  FormBody,
  FormDialog,
  FormField,
  FormGrid,
} from "@components/common";
import { TASK_STATUS_OPTIONS, TASK_TYPE_OPTIONS } from "@constants/tasks";
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
import { useCohorts } from "@features/cohorts";
import { ApiError } from "@lib/api-client";
import { createTask, updateTask } from "../api";
import { validateTask, type TaskErrors } from "../validation";
import type { Task, TaskStatus, TaskType } from "@types";

export type TaskFormDialogProps = {
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

export const TaskFormDialog = ({
  task,
  open,
  onOpenChange,
  onSaved,
}: TaskFormDialogProps) => {
  const { data: cohorts = [] } = useCohorts();
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [type, setType] = useState<TaskType>(task?.type ?? "coding");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "draft");
  const [cohortId, setCohortId] = useState(task?.cohortId?.toString() ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? "");
  const [errors, setErrors] = useState<TaskErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const found = validateTask({
      title,
      description: description ?? "",
      cohortId,
      status,
      dueDate,
      wasPublished: task?.status === "published",
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        // Send null (not undefined) so clearing the field persists — Prisma
        // treats undefined as "leave unchanged".
        description: description || null,
        type,
        status,
        dueDate: dueDate || undefined,
      };
      if (isEdit) {
        // cohortId is omitted on update: a task can't move cohorts, and the
        // update DTO rejects unknown fields.
        await updateTask(task.id, payload);
      } else {
        await createTask({ ...payload, cohortId: Number(cohortId) });
      }
      toast.success(isEdit ? "Task updated" : "Task created");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not save task. Please try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Task" : "Create Task"}
      actions={{
        onSubmit: handleSave,
        submitLabel: isEdit ? "Save Changes" : "Create Task",
        isLoading: isSaving,
        submitDisabled: !title.trim(),
      }}
    >
      <FormBody>
        <FormField label="Title" htmlFor="task-title" error={errors.title}>
          <Input
            id="task-title"
            value={title}
            aria-invalid={!!errors.title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors({});
            }}
            placeholder="Task title..."
          />
        </FormField>
        <FormField
          label="Description"
          htmlFor="task-description"
          error={errors.description}
        >
          <Textarea
            id="task-description"
            value={description ?? ""}
            aria-invalid={!!errors.description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors({});
            }}
            rows={3}
            placeholder="What should students do?"
          />
        </FormField>
        <FormGrid>
          <FormField label="Type">
            <Select
              value={type}
              onValueChange={(v) => setType(v as TaskType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPE_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as TaskStatus);
                setErrors({});
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormGrid>
        <FormGrid>
          <FormField label="Cohort" error={errors.cohortId}>
            {/* A task can't move cohorts once created: its submissions belong
                to the students of this cohort. */}
            <Select
              value={cohortId}
              disabled={isEdit}
              onValueChange={(v) => {
                setCohortId(v);
                setErrors({});
              }}
            >
              <SelectTrigger
                aria-label="Cohort"
                aria-invalid={!!errors.cohortId}
              >
                <SelectValue placeholder="Select cohort..." />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                A task can&apos;t move to another cohort.
              </p>
            )}
          </FormField>
          <FormField label="Due Date" error={errors.dueDate}>
            <DateInput
              value={dueDate}
              aria-invalid={!!errors.dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setErrors({});
              }}
            />
          </FormField>
        </FormGrid>
      </FormBody>
    </FormDialog>
  );
};
