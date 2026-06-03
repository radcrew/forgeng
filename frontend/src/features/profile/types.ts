import type { Cohort } from "@types";

export interface ProfileEnrollment {
  id: number;
  enrolledAt: string;
  cohort: Cohort;
}

export interface ProfileUpdate {
  name?: string;
  bio?: string;
  githubUrl?: string;
  avatarUrl?: string;
}
