"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Code2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { TASK_TYPE_ICON } from "@constants/tasks";
import { ApiError } from "@lib/api-client";
import { deleteTask } from "../api";
import type { Task } from "@types";

export type RowProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDeleted?: () => void;
};

export const Row = ({ task, onEdit, onDeleted }: RowProps) => {
  const Icon = TASK_TYPE_ICON[task.type] ?? Code2;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success("Task deleted");
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
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
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
                Due {format(new Date(task.dueDate), "MMM d, yyyy")}
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
          <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
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
    </Card>
  );
};
