import { LANDING_ART } from "@constants/landing/illustrations";
import type { Illustration } from "@constants/shared/illustration";

export interface RoleCard {
  role: string;
  headline: string;
  description: string;
  cta: string;
  href: string;
  art: Illustration;
}

export const ROLES: RoleCard[] = [
  {
    role: "Applicant",
    headline: "Your journey starts here.",
    description:
      "Fill out a 3-step application, tell us what drives you, and we'll get back to you. No fees, no prerequisites.",
    cta: "Apply Now",
    href: "/apply",
    art: LANDING_ART.roleApplicant,
  },
  {
    role: "Student",
    headline: "Build. Submit. Improve.",
    description:
      "Browse your cohort's task list, submit your work with notes, and read feedback on every submission.",
    cta: "Sign In",
    href: "/sign-in",
    art: LANDING_ART.roleStudent,
  },
  {
    role: "Admin",
    headline: "Run the program.",
    description:
      "Review applications, manage cohorts and tasks, and leave structured feedback on student submissions.",
    cta: "Sign In",
    href: "/sign-in",
    art: LANDING_ART.roleAdmin,
  },
];
