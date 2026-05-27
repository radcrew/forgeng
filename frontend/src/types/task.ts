export type TaskType = "coding" | "reading" | "project" | "quiz";

export type TaskStatus = "draft" | "published";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  cohortId: number;
  dueDate: string | null;
  submissionCount: number;
}
