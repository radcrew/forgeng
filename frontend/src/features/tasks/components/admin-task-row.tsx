"use client";

import { format } from "date-fns";
import { Code2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { TASK_TYPE_ICON } from "@features/tasks/task-type-icons";
import type { Task } from "@types";

export type AdminTaskRowProps = {
  task: Task;
  onEdit: (task: Task) => void;
};

export const AdminTaskRow = ({ task, onEdit }: AdminTaskRowProps) => {
  const Icon = TASK_TYPE_ICON[task.type] ?? Code2;

  const handleDelete = () => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    toast.success("Task deleted");
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
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
