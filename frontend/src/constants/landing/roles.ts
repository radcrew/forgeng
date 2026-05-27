import { PHOTOS } from "@constants/landing/photos";

export interface RoleCard {
  role: string;
  /** Tailwind classes for the role badge background + text color. */
  color: string;
  headline: string;
  description: string;
  cta: string;
  href: string;
  photo: string;
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
    photo: PHOTOS.interview,
  },
  {
    role: "Student",
    color: "bg-primary/10 text-primary",
    headline: "Build. Submit. Improve.",
    description:
      "Browse your cohort's task list, submit your code with notes, and see mentor feedback land in your inbox.",
    cta: "Sign In",
    href: "/sign-in",
    photo: PHOTOS.coding,
  },
  {
    role: "Mentor",
    color: "bg-emerald-100 text-emerald-700",
    headline: "Shape the next generation.",
    description:
      "Review queued submissions from your cohort, leave structured feedback, and mark work approved or needing revision.",
    cta: "Sign In",
    href: "/sign-in",
    photo: PHOTOS.mentoring,
  },
];
