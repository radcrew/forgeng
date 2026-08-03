import {
  Award,
  Banknote,
  ClipboardList,
  Code2,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

import { LANDING_ART } from "@constants/landing/illustrations";
import type { Illustration } from "@constants/shared/illustration";

export interface Step {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  art: Illustration;
}

export const STEPS: Step[] = [
  {
    number: "01",
    title: "Apply",
    description:
      "Submit a short application telling us about your background, goals, and motivation. No CS degree required — we care about drive.",
    icon: ClipboardList,
    art: LANDING_ART.stepApply,
  },
  {
    number: "02",
    title: "Join a Cohort",
    description:
      "Accepted applicants are placed into a cohort with a dedicated mentor and peers at the same stage.",
    icon: Users,
    art: LANDING_ART.stepCohort,
  },
  {
    number: "03",
    title: "Complete Real Tasks",
    description:
      "Work through structured coding assignments, reading modules, and projects inside your cohort timeline.",
    icon: Code2,
    art: LANDING_ART.stepTasks,
  },
  {
    number: "04",
    title: "Get Expert Feedback",
    description:
      "Mentors review every submission. You receive detailed feedback with a clear verdict — approved or needs work.",
    icon: MessageSquare,
    art: LANDING_ART.stepFeedback,
  },
  {
    number: "05",
    title: "Get Paid",
    description:
      "Finish every task due that month and receive your monthly stipend — automatic and no negotiation needed. Complete the work, get the money.",
    icon: Banknote,
    art: LANDING_ART.stepStipend,
  },
  {
    number: "06",
    title: "Level Up",
    description:
      "Track your progress, build a portfolio of real work, and graduate with evidence of what you can actually do.",
    icon: Award,
    art: LANDING_ART.stepLevelUp,
  },
];
