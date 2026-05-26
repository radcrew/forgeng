export type UserRole = "applicant" | "student" | "mentor" | "admin";

export type ApplicationStatus = "pending" | "reviewing" | "accepted" | "rejected";

export type CohortStatus = "draft" | "active" | "completed";

export type TaskType = "coding" | "reading" | "project" | "quiz";

export type TaskStatus = "draft" | "published";

export type SubmissionStatus = "submitted" | "approved" | "needs_work";

export type FeedbackVerdict = "approved" | "needs_work";

export interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  githubUrl: string | null;
  createdAt: string;
}

export interface Application {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  background: string | null;
  experience: string | null;
  motivation: string | null;
  status: ApplicationStatus;
  cohortId: number | null;
  reviewerNote: string | null;
  createdAt: string;
}

export interface Cohort {
  id: number;
  name: string;
  description: string | null;
  capacity: number;
  status: CohortStatus;
  startDate: string | null;
  endDate: string | null;
  enrolledCount: number;
}

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
  mentor?: Pick<UserProfile, "id" | "name" | "email">;
  content: string;
  verdict: FeedbackVerdict;
  createdAt: string;
}

export interface Enrollment {
  id: number;
  userId: number;
  cohortId: number;
  user?: Pick<UserProfile, "id" | "name" | "email">;
  enrolledAt: string;
}
