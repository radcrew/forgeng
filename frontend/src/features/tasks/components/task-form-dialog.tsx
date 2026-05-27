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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { useCohorts } from "@features/cohorts";
import type { Task, TaskStatus, TaskType } from "@types";

export type TaskFormDialogProps = {
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const TaskFormDialog = ({
  task,
  open,
  onOpenChange,
}: TaskFormDialogProps) => {
  const { data: cohorts = [] } = useCohorts();
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [type, setType] = useState<TaskType>(task?.type ?? "coding");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "draft");
  const [cohortId, setCohortId] = useState(task?.cohortId?.toString() ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title || !cohortId) return;
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSaving(false);
    toast.success(isEdit ? "Task updated" : "Task created");
    onOpenChange(false);
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
        submitDisabled: !title || !cohortId,
      }}
    >
      <FormBody>
        <FormField label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
          />
        </FormField>
        <FormField label="Description">
          <Textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
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
              onValueChange={(v) => setStatus(v as TaskStatus)}
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
          <FormField label="Cohort">
            <Select value={cohortId} onValueChange={setCohortId}>
              <SelectTrigger>
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
          </FormField>
          <FormField label="Due Date">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </FormField>
        </FormGrid>
      </FormBody>
    </FormDialog>
  );
};
