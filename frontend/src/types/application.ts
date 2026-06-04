export type ApplicationStatus = "pending" | "reviewing" | "accepted" | "rejected";

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
  address: string | null;
  videoUrl: string | null;
  walletEvm: string | null;
  walletSolana: string | null;
  walletTron: string | null;
  status: ApplicationStatus;
  cohortId: number | null;
  reviewerNote: string | null;
  createdAt: string;
}

export type ApplicationStatusFilter = ApplicationStatus | "all";
