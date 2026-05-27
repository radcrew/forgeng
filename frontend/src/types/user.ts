export type UserRole = "applicant" | "student" | "mentor" | "admin";

export interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  githubUrl: string | null;
  createdAt: string;
}
