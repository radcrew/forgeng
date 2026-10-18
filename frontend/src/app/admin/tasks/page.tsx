"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { LoadingState } from "@components/common";
import {
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
} from "@components/shared";
import { TASK_SORT_OPTIONS, type TaskSort } from "@constants/tasks";
import { APP_ART } from "@constants/shared/app-illustrations";
import { useCohorts } from "@features/cohorts";
import {
  ALL_TASKS_FILTER,
  TASK_STATUS_OPTIONS,
  TaskFormDialog,
  sortTasks,
  TaskRow,
  filterTasks,
  useTasks,
  type TaskListFilter,
} from "@features/tasks";
import type { Task } from "@types";

const PAGE_SIZE = 20;

const Page = () => {
  const { data: tasks = [], isLoading, error, refetch } = useTasks();
  const { data: cohorts = [] } = useCohorts();
  const cohortNames = new Map(cohorts.map((c) => [c.id, c.name]));
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>(undefined);
  const [sort, setSort] = useState<TaskSort>("recent");
  const [filter, setFilter] = useState<TaskListFilter>(ALL_TASKS_FILTER);
  const [page, setPage] = useState(1);

  // Filter, then sort, then split into pages.
  const matching = sortTasks(filterTasks(tasks, filter), sort);
  const totalPages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  // Deleting the last task on the last page must not leave an empty page.
  const currentPage = Math.min(page, totalPages);
  const visible = matching.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // A new filter starts at page 1, so a short result is never hidden on a
  // page that no longer exists.
  const updateFilter = (change: Partial<TaskListFilter>) => {
    setFilter((f) => ({ ...f, ...change }));
    setPage(1);
  };

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

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter.search}
            onChange={(e) => updateFilter({ search: e.target.value })}
            placeholder="Search by title..."
            aria-label="Search tasks by title"
            className="pl-9"
          />
        </div>
        <Select
          value={filter.cohortId}
          onValueChange={(cohortId) => updateFilter({ cohortId })}
        >
          <SelectTrigger className="sm:w-48" aria-label="Filter by cohort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cohorts</SelectItem>
            {cohorts.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.status}
          onValueChange={(status) =>
            updateFilter({ status: status as TaskListFilter["status"] })
          }
        >
          <SelectTrigger className="sm:w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TASK_STATUS_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as TaskSort);
            setPage(1);
          }}
        >
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
        {/* A failed reload keeps the old list, so keep it on screen and say
            only that the refresh failed. */}
        {!isLoading && error && (
          <ErrorState
            what="the tasks"
            message={
              tasks.length > 0 ? "We couldn't refresh the tasks." : undefined
            }
            size={tasks.length > 0 ? "compact" : "default"}
            onRetry={refetch}
          />
        )}
        {!isLoading && !error && tasks.length === 0 && (
          <EmptyState
            message="No tasks yet. Create your first task to get started."
            art={APP_ART.tasks}
          />
        )}
        {!isLoading && tasks.length > 0 && matching.length === 0 && (
          <EmptyState
            message="No tasks match these filters."
            art={APP_ART.noResults}
          />
        )}
        {visible.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            cohortName={cohortNames.get(task.cohortId)}
            onEdit={(t) => {
              setEditTask(t);
              setFormOpen(true);
            }}
            onDeleted={refetch}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

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
