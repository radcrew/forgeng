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

/**
 * Admin-only view of a user. Registration forensics stay out of UserProfile
 * so they are never persisted to the localStorage session.
 */
export interface AdminUserDetail extends UserProfile {
  registrationIp: string | null;
  registrationCountry: string | null;
  registrationCity: string | null;
}
