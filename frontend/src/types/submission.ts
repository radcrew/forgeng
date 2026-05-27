import type { Task } from "./task";
import type { UserProfile } from "./user";

export type SubmissionStatus = "submitted" | "approved" | "needs_work";

export type FeedbackVerdict = "approved" | "needs_work";

export interface Submission {
  id: number;
  taskId: number;
  task?: Pick<Task, "id" | "title" | "type">;
  user?: Pick<UserProfile, "id" | "name" | "email">;
  content: string | null;
  repoUrl: string | null;
  status: SubmissionStatus;
  feedbackCount: number;
  createdAt: string;
}

export interface Feedback {
  id: number;
  submissionId: number;
  reviewerId: number;
  reviewer?: Pick<UserProfile, "id" | "name" | "email">;
  content: string;
  verdict: FeedbackVerdict;
  createdAt: string;
}

export type SubmissionStatusFilter = SubmissionStatus | "all";
