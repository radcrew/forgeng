export type NotificationType = "feedback_received" | "task_published";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  /** In-app deep link, e.g. /student/submissions or /student/tasks/:id. */
  link: string | null;
  readAt: string | null;
  createdAt: string;
}
