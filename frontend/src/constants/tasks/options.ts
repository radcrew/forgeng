import type { TaskStatus, TaskType } from "@types";

import type { LabeledValue } from "../shared/labeled-value";

export const TASK_TYPE_OPTIONS: LabeledValue<TaskType>[] = [
  { value: "coding", label: "Coding" },
  { value: "reading", label: "Reading" },
  { value: "project", label: "Project" },
  { value: "quiz", label: "Quiz" },
];

export const TASK_STATUS_OPTIONS: LabeledValue<TaskStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];
