export type UserRole = "applicant" | "student" | "admin";

export type UserRoleFilter = UserRole | "all";

export interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  bio: string | null;
  githubUrl: string | null;
  avatarUrl: string | null;
  createdAt: string;
}
