import type { UserProfile } from "./user";

export type CohortStatus = "draft" | "active" | "completed";

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

export interface Enrollment {
  id: number;
  userId: number;
  cohortId: number;
  user?: UserProfile;
  enrolledAt: string;
}
