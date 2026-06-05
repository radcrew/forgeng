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
  // Social links from the user's application record.
  linkedin: string | null;
  twitter: string | null;
  facebook: string | null;
  github: string | null;
  portfolio: string | null;
  telegram: string | null;
  whatsapp: string | null;
}
