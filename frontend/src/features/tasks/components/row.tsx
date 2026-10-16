"use client";

import { useState } from "react";
import { Code2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { FormDialog } from "@components/common";
import { TASK_TYPE_ICON } from "@constants/tasks";
import { ApiError } from "@lib/api-client";
import { formatCalendarDate } from "@utils";
import { deleteTask } from "../api";
import type { Task } from "@types";

export type TaskRowProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDeleted?: () => void;
};

export const TaskRow = ({ task, onEdit, onDeleted }: TaskRowProps) => {
  const Icon = TASK_TYPE_ICON[task.type] ?? Code2;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success("Task deleted");
      setConfirmOpen(false);
      onDeleted?.();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not delete task. Please try again.";
      toast.error(message);
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-4 p-5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary-strong shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{task.title}</p>
          {task.description && (
            <p className="text-sm text-muted-foreground truncate">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className="text-xs capitalize">
              {task.type}
            </Badge>
            {task.dueDate && (
              <span className="text-xs text-muted-foreground">
                Due {formatCalendarDate(task.dueDate)}
              </span>
            )}
            {task.submissionCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {task.submissionCount} submissions
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge
            variant={task.status === "published" ? "default" : "secondary"}
            className="capitalize"
          >
            {task.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit task"
            onClick={() => onEdit(task)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete task"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <FormDialog
        open={confirmOpen}
        onOpenChange={(open) => !isDeleting && setConfirmOpen(open)}
        title={`Delete "${task.title}"?`}
        size="sm"
        actions={{
          onSubmit: () => void handleDelete(),
          submitLabel: "Delete task",
          loadingLabel: "Deleting...",
          isLoading: isDeleting,
          submitVariant: "destructive",
        }}
      >
        <div className="space-y-2 text-sm text-muted-foreground">
          {task.submissionCount > 0 && (
            <p>
              This also deletes, for good,{" "}
              {task.submissionCount === 1
                ? "1 student submission"
                : `${task.submissionCount} student submissions`}{" "}
              and all their feedback.
            </p>
          )}
          <p className="font-medium text-destructive">This cannot be undone.</p>
        </div>
      </FormDialog>
    </Card>
  );
};
