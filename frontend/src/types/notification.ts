export type NotificationType =
  | "feedback_received"
  | "task_published"
  | "submission_received"
  | "application_received";

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

export interface NotificationPreferences {
  feedbackInApp: boolean;
  feedbackEmail: boolean;
  /** A Slack direct message, once the student has joined the Forgeng Slack. */
  feedbackSlack: boolean;
  taskInApp: boolean;
  taskEmail: boolean;
}
