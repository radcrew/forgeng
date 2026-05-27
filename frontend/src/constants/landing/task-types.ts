import {
  BookOpen,
  ClipboardList,
  Code2,
  FolderGit2,
  type LucideIcon,
} from "lucide-react";

export interface TaskType {
  icon: LucideIcon;
  label: string;
  description: string;
}

export const TASK_TYPES: TaskType[] = [
  { icon: Code2, label: "Coding", description: "Write and ship real code" },
  {
    icon: BookOpen,
    label: "Reading",
    description: "Digest technical concepts",
  },
  {
    icon: FolderGit2,
    label: "Projects",
    description: "End-to-end deliverables",
  },
  {
    icon: ClipboardList,
    label: "Quizzes",
    description: "Check your understanding",
  },
];
