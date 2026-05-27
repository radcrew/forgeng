import { BookOpen, Code2, FolderGit2, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { TaskType } from "@types";

export const TASK_TYPE_ICON: Record<TaskType, LucideIcon> = {
  coding: Code2,
  reading: BookOpen,
  project: FolderGit2,
  quiz: HelpCircle,
};
