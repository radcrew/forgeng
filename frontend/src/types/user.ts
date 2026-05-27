export type UserRole = "applicant" | "student" | "admin";

export type UserRoleFilter = UserRole | "all";

export interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  githubUrl: string | null;
  createdAt: string;
}
