"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  FolderGit2,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  mockStudentDashboard,
  mockSubmissions,
  mockTasks,
} from "@/lib/mock-data";
import type { Task, TaskType } from "@/lib/types";

const TASK_TYPE_ICON: Record<TaskType, LucideIcon> = {
  coding: Code2,
  reading: BookOpen,
  project: FolderGit2,
  quiz: HelpCircle,
};

function SubmitDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Submit: {task.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="repoUrl">Repository URL (optional)</Label>
            <Input
              id="repoUrl"
              placeholder="https://github.com/you/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Notes / Write-up (optional)</Label>
            <Textarea
              id="content"
              placeholder="Describe your solution, approach, or any notes for the reviewer..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentTasksPage() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const cohort = mockStudentDashboard.cohort;
  const tasks = useMemo(
    () => mockTasks.filter((t) => t.cohortId === cohort.id),
    [cohort.id],
  );
  const submissionByTaskId = useMemo(
    () => new Map(mockSubmissions.map((s) => [s.taskId, s])),
    [],
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-1">
          {cohort.name} — {tasks.length} tasks
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            No tasks have been published for your cohort yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const submission = submissionByTaskId.get(task.id);
            const Icon = TASK_TYPE_ICON[task.type] ?? Code2;
            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge
                        variant="outline"
                        className="capitalize text-xs"
                      >
                        {task.type}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due{" "}
                          {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {submission ? (
                      <Badge
                        variant={
                          submission.status === "approved"
                            ? "default"
                            : submission.status === "needs_work"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {submission.status === "approved" && (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {submission.status.replace("_", " ")}
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => setSelectedTask(task)}>
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <SubmitDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
