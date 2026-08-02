import { LANDING_ART } from "@constants/landing/illustrations";
import type { Illustration } from "@constants/shared/illustration";

export interface RoleCard {
  role: string;
  /** Tailwind classes for the role badge background + text color. */
  color: string;
  headline: string;
  description: string;
  cta: string;
  href: string;
  art: Illustration;
}

export const ROLES: RoleCard[] = [
  {
    role: "Applicant",
    color: "bg-slate-100 text-slate-700",
    headline: "Your journey starts here.",
    description:
      "Fill out a 3-step application, tell us what drives you, and we'll get back to you. No fees, no prerequisites.",
    cta: "Apply Now",
    href: "/apply",
    art: LANDING_ART.roleApplicant,
  },
  {
    role: "Student",
    color: "bg-primary/10 text-primary",
    headline: "Build. Submit. Improve.",
    description:
      "Browse your cohort's task list, submit your work with notes, and read feedback on every submission.",
    cta: "Sign In",
    href: "/sign-in",
    art: LANDING_ART.roleStudent,
  },
  {
    role: "Admin",
    color: "bg-emerald-100 text-emerald-700",
    headline: "Run the program.",
    description:
      "Review applications, manage cohorts and tasks, and leave structured feedback on student submissions.",
    cta: "Sign In",
    href: "/sign-in",
    art: LANDING_ART.roleAdmin,
  },
];
