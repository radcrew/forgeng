import type { Cohort } from "@types";

export interface ProfileEnrollment {
  id: number;
  enrolledAt: string;
  cohort: Cohort;
}

export interface ProfileUpdate {
  name?: string;
  bio?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  github?: string;
  portfolio?: string;
  telegram?: string;
  whatsapp?: string;
  avatarUrl?: string;
}
