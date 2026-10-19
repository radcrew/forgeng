import type {
  Application,
  Cohort,
  Enrollment,
  Feedback,
  Notification,
  NotificationPreference,
  Submission,
  Task,
  User,
} from '@prisma/client';

import { isCohortEnded } from '../utils/date';

/**
 * Serializers that map Prisma row shapes to the OpenAPI / frontend contracts.
 * All `Date` values become ISO strings, optional foreign rows become `null`.
 */

type ApplicationSocials = Pick<
  Application,
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'github'
  | 'portfolio'
  | 'telegram'
  | 'whatsapp'
>;

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
  registrationIp: string | null;
  registrationCountry: string | null;
  registrationCity: string | null;
  createdAt: string;
  // Social links sourced from the user's application; null when no application exists.
  linkedin: string | null;
  twitter: string | null;
  facebook: string | null;
  github: string | null;
  portfolio: string | null;
  telegram: string | null;
  whatsapp: string | null;
}

export function toUserDto(
  user: User,
  socials?: ApplicationSocials | null,
): UserDto {
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
    registrationIp: user.registrationIp,
    registrationCountry: user.registrationCountry,
    registrationCity: user.registrationCity,
    createdAt: user.createdAt.toISOString(),
    linkedin: socials?.linkedin ?? null,
    twitter: socials?.twitter ?? null,
    facebook: socials?.facebook ?? null,
    github: socials?.github ?? null,
    portfolio: socials?.portfolio ?? null,
    telegram: socials?.telegram ?? null,
    whatsapp: socials?.whatsapp ?? null,
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
  linkedin: string | null;
  twitter: string | null;
  facebook: string | null;
  github: string | null;
  portfolio: string | null;
  telegram: string | null;
  whatsapp: string | null;
  country: string | null;
  videoUrl: string | null;
  wallets: Array<{ chain: string; address: string }> | null;
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
    linkedin: app.linkedin,
    twitter: app.twitter,
    facebook: app.facebook,
    github: app.github,
    portfolio: app.portfolio,
    telegram: app.telegram,
    whatsapp: app.whatsapp,
    country: app.country,
    videoUrl: app.videoUrl,
    wallets: app.wallets as Array<{ chain: string; address: string }> | null,
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
  /**
   * The task's cohort has ended, so the work can't be resubmitted. Worked
   * out here so a page never has to guess it from the student's current
   * cohort, which may be a different one, or none.
   */
  cohortEnded: boolean;
  /** The cohort of the task, so a reviewer can tell cohorts apart. */
  cohort: { id: number; name: string } | null;
  lastSubmittedAt: string;
  createdAt: string;
}

export function toSubmissionDto(
  sub: Submission,
  // The cohort is required, so every caller loads it and cohortEnded is
  // never a guess.
  task:
    | (Task & {
        cohort: Pick<Cohort, 'id' | 'name' | 'status' | 'endDate'>;
      })
    | null,
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
    cohortEnded: task ? isCohortEnded(task.cohort) : false,
    cohort: task ? { id: task.cohort.id, name: task.cohort.name } : null,
    lastSubmittedAt: sub.lastSubmittedAt.toISOString(),
    createdAt: sub.createdAt.toISOString(),
  };
}

export interface FeedbackDto {
  id: number;
  submissionId: number;
  reviewerId: number;
  content: string;
  verdict: Feedback['verdict'];
  // Students see feedback too, so only the reviewer's public details go out.
  reviewer: Pick<UserDto, 'id' | 'name' | 'avatarUrl'> | null;
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
    reviewer: reviewer
      ? { id: reviewer.id, name: reviewer.name, avatarUrl: reviewer.avatarUrl }
      : null,
    createdAt: fb.createdAt.toISOString(),
  };
}

export interface NotificationDto {
  id: number;
  type: Notification['type'];
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function toNotificationDto(notification: Notification): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export interface NotificationPreferenceDto {
  feedbackInApp: boolean;
  feedbackEmail: boolean;
  taskInApp: boolean;
  taskEmail: boolean;
}

/** A missing row means every channel is on, so absent fields default to `true`. */
export function toNotificationPreferenceDto(
  pref: NotificationPreference | null,
): NotificationPreferenceDto {
  return {
    feedbackInApp: pref?.feedbackInApp ?? true,
    feedbackEmail: pref?.feedbackEmail ?? true,
    taskInApp: pref?.taskInApp ?? true,
    taskEmail: pref?.taskEmail ?? true,
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
