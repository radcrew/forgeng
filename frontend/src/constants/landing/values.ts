import { Hammer, Target, Users, type LucideIcon } from "lucide-react";

export interface Value {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const VALUES: Value[] = [
  {
    icon: Hammer,
    title: "Real work, not theory",
    description:
      "We don't drill leetcode. Every task mirrors something a working engineer actually does on the job.",
  },
  {
    icon: Users,
    title: "Mentors who ship",
    description:
      "Reviewers are senior+ engineers writing production code today — not academics or career coaches.",
  },
  {
    icon: Target,
    title: "Outcomes over vibes",
    description:
      "Every submission gets an explicit verdict and concrete next steps. Progress is measurable, not vibes-based.",
  },
];
