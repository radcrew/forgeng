export type ApplicationStatus = "pending" | "reviewing" | "accepted" | "rejected";

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

export type ApplicationStatusFilter = ApplicationStatus | "all";
