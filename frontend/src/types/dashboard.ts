import type { Application } from "./application";
import type { Cohort } from "./cohort";
import type { Submission } from "./submission";

export interface StudentDashboard {
  // The dashboard endpoint already serializes the full cohort; the cohort
  // overview page relies on the description, dates, capacity, and status.
  cohort: Cohort | null;
  taskStats: {
    total: number;
    submitted: number;
    approved: number;
    pending: number;
  };
  nextDeadline: string | null;
  recentSubmissions: Submission[];
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
}
