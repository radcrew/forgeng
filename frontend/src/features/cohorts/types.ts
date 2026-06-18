export type { Cohort, CohortStatus, Enrollment } from "@types";

export type CohortStudentProgress = {
  userId: number;
  name: string;
  email: string;
  approved: number;
  submitted: number;
  needsWork: number;
  todo: number;
};
