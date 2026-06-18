"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@components/ui/button";
import { LoadingState } from "@components/common";
import { PageContainer, PageHeader } from "@components/shared";
import { TaskFormDialog, TaskRow, useTasks } from "@features/tasks";
import type { Task } from "@types";

const Page = () => {
  const { data: tasks = [], isLoading, refetch } = useTasks();
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>(undefined);

  return (
    <PageContainer maxWidth="5xl">
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

      <div className="space-y-3">
        {isLoading ? <LoadingState message="Loading tasks…" /> : null}
        {tasks.map((task) => (
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
