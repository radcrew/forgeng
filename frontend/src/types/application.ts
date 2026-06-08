export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface Application {
  id: number;
  userId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  background: string | null;
  experience: string | null;
  motivation: string | null;
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
  status: ApplicationStatus;
  cohortId: number | null;
  reviewerNote: string | null;
  createdAt: string;
}

export type ApplicationStatusFilter = ApplicationStatus | "all";
