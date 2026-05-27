import type { UserProfile } from "@types";

/** Default landing page for a given role (used by the role guard + sign-in). */
export const homeForRole = (role: UserProfile["role"]): string => {
  switch (role) {
    case "student":
      return "/student";
    case "admin":
      return "/admin";
    case "applicant":
    default:
      return "/apply";
  }
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
