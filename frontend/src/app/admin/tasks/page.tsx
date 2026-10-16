"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { LoadingState } from "@components/common";
import { PageContainer, PageHeader } from "@components/shared";
import { TASK_SORT_OPTIONS, type TaskSort } from "@constants/tasks";
import {
  TaskFormDialog,
  TaskRow,
  sortTasks,
  useTasks,
} from "@features/tasks";
import type { Task } from "@types";

const Page = () => {
  const { data: tasks = [], isLoading, refetch } = useTasks();
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>(undefined);
  const [sort, setSort] = useState<TaskSort>("recent");
  const sorted = sortTasks(tasks, sort);

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description="Author and manage tasks across cohorts."
        actions={
          <Button
            onClick={() => {
              setEditTask(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        }
      />

      <div className="flex justify-end">
        <Select value={sort} onValueChange={(v) => setSort(v as TaskSort)}>
          <SelectTrigger className="sm:w-48" aria-label="Sort tasks">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                Sort: {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {isLoading ? <LoadingState message="Loading tasks…" /> : null}
        {sorted.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onEdit={(t) => {
              setEditTask(t);
              setFormOpen(true);
            }}
            onDeleted={refetch}
          />
        ))}
      </div>

      <TaskFormDialog
        key={editTask?.id ?? "new"}
        task={editTask}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditTask(undefined);
        }}
        onSaved={refetch}
      />
    </PageContainer>
  );
};

export default Page;
