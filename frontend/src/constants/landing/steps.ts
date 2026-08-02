import {
  Award,
  Banknote,
  ClipboardList,
  Code2,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  StepApplyScene,
  StepCohortScene,
  StepFeedbackScene,
  StepLevelUpScene,
  StepStipendScene,
  StepTasksScene,
  type SceneIllustration,
} from "@components/illustrations";

export interface Step {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  scene: SceneIllustration;
}

export const STEPS: Step[] = [
  {
    number: "01",
    title: "Apply",
    description:
      "Submit a short application telling us about your background, goals, and motivation. No CS degree required — we care about drive.",
    icon: ClipboardList,
    scene: StepApplyScene,
  },
  {
    number: "02",
    title: "Join a Cohort",
    description:
      "Accepted applicants are placed into a cohort with a dedicated mentor and peers at the same stage.",
    icon: Users,
    scene: StepCohortScene,
  },
  {
    number: "03",
    title: "Complete Real Tasks",
    description:
      "Work through structured coding assignments, reading modules, and projects inside your cohort timeline.",
    icon: Code2,
    scene: StepTasksScene,
  },
  {
    number: "04",
    title: "Get Expert Feedback",
    description:
      "Mentors review every submission. You receive detailed feedback with a clear verdict — approved or needs work.",
    icon: MessageSquare,
    scene: StepFeedbackScene,
  },
  {
    number: "05",
    title: "Get Paid",
    description:
      "Finish every task due that month and receive your monthly stipend — automatic and no negotiation needed. Complete the work, get the money.",
    icon: Banknote,
    scene: StepStipendScene,
  },
  {
    number: "06",
    title: "Level Up",
    description:
      "Track your progress, build a portfolio of real work, and graduate with evidence of what you can actually do.",
    icon: Award,
    scene: StepLevelUpScene,
  },
];
