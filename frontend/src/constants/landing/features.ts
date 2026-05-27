import {
  BarChart3,
  BookOpen,
  FolderGit2,
  MessageSquare,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
  {
    icon: FolderGit2,
    title: "Real Projects",
    description:
      "Every task is hands-on. You write code, push it to GitHub, and get expert eyes on it — not auto-graders.",
  },
  {
    icon: Users,
    title: "Cohort Learning",
    description:
      "You learn alongside peers at the same stage. Cohorts keep you accountable and motivated.",
  },
  {
    icon: MessageSquare,
    title: "Mentor Feedback",
    description:
      "Every submission is reviewed by a working engineer who explains exactly what to improve and why.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Your dashboard shows task completion, submission history, and upcoming deadlines at a glance.",
  },
  {
    icon: BookOpen,
    title: "Structured Curriculum",
    description:
      "Tasks progress from fundamentals to advanced topics — no guessing what to learn next.",
  },
  {
    icon: Zap,
    title: "Fast Turnaround",
    description:
      "Mentors aim to review submissions within 48 hours so you're never blocked waiting for feedback.",
  },
];
