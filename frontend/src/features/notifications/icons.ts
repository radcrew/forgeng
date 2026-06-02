import { Bell, ClipboardList, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { NotificationType } from "@types";

/** Lucide icon per notification type; fall back to {@link FALLBACK_NOTIFICATION_ICON}. */
export const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  feedback_received: MessageSquare,
  task_published: ClipboardList,
};

export const FALLBACK_NOTIFICATION_ICON = Bell;
