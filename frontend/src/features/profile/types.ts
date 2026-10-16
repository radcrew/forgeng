import type { Cohort } from "@types";

export interface ProfileEnrollment {
  id: number;
  enrolledAt: string;
  cohort: Cohort;
}

/** Leaving a field out keeps it; null removes a saved value. */
export interface ProfileUpdate {
  name?: string;
  bio?: string;
  linkedin?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  github?: string | null;
  portfolio?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  avatarUrl?: string;
}
