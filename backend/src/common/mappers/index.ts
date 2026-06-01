import type {
  Application,
  Cohort,
  Enrollment,
  Feedback,
  Submission,
  Task,
  User,
} from '@prisma/client';

/**
 * Serializers that map Prisma row shapes to the OpenAPI / frontend contracts.
 * All `Date` values become ISO strings, optional foreign rows become `null`.
 */

export interface UserDto {
  id: number;
  clerkId: string | null;
  email: string;
  emailVerified: boolean;
  name: string | null;
  role: User['role'];
  bio: string | null;
  githubUrl: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    role: user.role,
    bio: user.bio,
    githubUrl: user.githubUrl,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

export interface ApplicationDto {
  id: number;
  userId: number | null;
  email: string;
  firstName: string;
  lastName: string;
  status: Application['status'];
  motivation: string | null;
  background: string | null;
  experience: string | null;
  reviewerNote: string | null;
  cohortId: number | null;
  createdAt: string;
}

export function toApplicationDto(app: Application): ApplicationDto {
  return {
    id: app.id,
    userId: app.userId,
    email: app.email,
    firstName: app.firstName,
    lastName: app.lastName,
    status: app.status,
    motivation: app.motivation,
    background: app.background,
    experience: app.experience,
    reviewerNote: app.reviewerNote,
    cohortId: app.cohortId,
    createdAt: app.createdAt.toISOString(),
  };
}

export interface CohortDto {
  id: number;
  name: string;
  description: string | null;
  status: Cohort['status'];
  capacity: number;
  enrolledCount: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export function toCohortDto(cohort: Cohort, enrolledCount: number): CohortDto {
  return {
    id: cohort.id,
    name: cohort.name,
    description: cohort.description,
    status: cohort.status,
    capacity: cohort.capacity,
    enrolledCount,
    startDate: cohort.startDate?.toISOString() ?? null,
    endDate: cohort.endDate?.toISOString() ?? null,
    createdAt: cohort.createdAt.toISOString(),
  };
}

export interface TaskDto {
  id: number;
  cohortId: number;
  title: string;
  description: string | null;
  type: Task['type'];
  status: Task['status'];
  dueDate: string | null;
  submissionCount: number;
  createdAt: string;
}

export function toTaskDto(task: Task, submissionCount: number): TaskDto {
  return {
    id: task.id,
    cohortId: task.cohortId,
    title: task.title,
    description: task.description,
    type: task.type,
    status: task.status,
    dueDate: task.dueDate?.toISOString() ?? null,
    submissionCount,
    createdAt: task.createdAt.toISOString(),
  };
}

export interface SubmissionDto {
  id: number;
  taskId: number;
  userId: number;
  content: string | null;
  repoUrl: string | null;
  status: Submission['status'];
  task: TaskDto | null;
  user: UserDto | null;
  feedbackCount: number;
  createdAt: string;
}

export function toSubmissionDto(
  sub: Submission,
  task: Task | null,
  user: User | null,
  feedbackCount: number,
): SubmissionDto {
  return {
    id: sub.id,
    taskId: sub.taskId,
    userId: sub.userId,
    content: sub.content,
    repoUrl: sub.repoUrl,
    status: sub.status,
    task: task ? toTaskDto(task, 0) : null,
    user: user ? toUserDto(user) : null,
    feedbackCount,
    createdAt: sub.createdAt.toISOString(),
  };
}

export interface FeedbackDto {
  id: number;
  submissionId: number;
  reviewerId: number;
  content: string;
  verdict: Feedback['verdict'];
  reviewer: UserDto | null;
  createdAt: string;
}

export function toFeedbackDto(
  fb: Feedback,
  reviewer: User | null,
): FeedbackDto {
  return {
    id: fb.id,
    submissionId: fb.submissionId,
    reviewerId: fb.reviewerId,
    content: fb.content,
    verdict: fb.verdict,
    reviewer: reviewer ? toUserDto(reviewer) : null,
    createdAt: fb.createdAt.toISOString(),
  };
}

/** A student's own enrollment, with the cohort they joined — for the profile page. */
export interface ProfileEnrollmentDto {
  id: number;
  enrolledAt: string;
  cohort: CohortDto;
}

export interface EnrollmentDto {
  id: number;
  userId: number;
  cohortId: number;
  enrolledAt: string;
  user: UserDto | null;
}

export function toEnrollmentDto(
  enrollment: Enrollment,
  user: User | null,
): EnrollmentDto {
  return {
    id: enrollment.id,
    userId: enrollment.userId,
    cohortId: enrollment.cohortId,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    user: user ? toUserDto(user) : null,
  };
}
