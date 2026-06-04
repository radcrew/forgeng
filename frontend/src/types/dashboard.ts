import type { Application } from "./application";
import type { Cohort, CohortStatus } from "./cohort";
import type { Submission } from "./submission";
import type { TaskType } from "./task";

export interface StudentAnalytics {
  statusBreakdown: {
    todo: number;
    submitted: number;
    needsWork: number;
    approved: number;
  };
  typeBreakdown: { type: TaskType; total: number; approved: number }[];
  weeklyActivity: { weekStart: string; submissions: number }[];
}

export interface StudentDashboard {
  // The dashboard endpoint already serializes the full cohort; the cohort
  // overview page relies on the description, dates, capacity, and status.
  cohort: Cohort | null;
  // All cohorts the student belongs to (newest first) for the cohort switcher.
  cohorts: { id: number; name: string }[];
  taskStats: {
    total: number;
    submitted: number;
    approved: number;
    pending: number;
  };
  nextDeadline: string | null;
  recentSubmissions: Submission[];
  analytics: StudentAnalytics;
}

export interface AdminCohortStat {
  id: number;
  name: string;
  status: CohortStatus;
  students: number;
  tasks: number;
  submissions: number;
}

export interface AdminAnalytics {
  submissionBreakdown: {
    submitted: number;
    approved: number;
    needsWork: number;
  };
  weeklyActivity: { weekStart: string; submissions: number }[];
  cohortStats: AdminCohortStat[];
}

export interface AdminDashboard {
  applicationStats: {
    total: number;
    pending: number;
    reviewing: number;
    accepted: number;
    rejected: number;
  };
  activeCohorts: number;
  totalStudents: number;
  pendingReviews: number;
  recentApplications: Application[];
  recentSubmissions: Submission[];
  analytics: AdminAnalytics;
}
