import type { Application } from "./application";
import type { Cohort } from "./cohort";
import type { Submission } from "./submission";

export interface StudentDashboard {
  cohort: Pick<Cohort, "id" | "name"> | null;
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
