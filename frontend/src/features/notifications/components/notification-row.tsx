import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";

import { cn } from "@utils";
import type { Notification } from "@types";

import { FALLBACK_NOTIFICATION_ICON, NOTIFICATION_ICONS } from "../icons";

export interface NotificationRowProps {
  notification: Notification;
  deleting: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function NotificationRow({
  notification,
  deleting,
  onClick,
  onDelete,
}: NotificationRowProps) {
  const Icon =
    NOTIFICATION_ICONS[notification.type] ?? FALLBACK_NOTIFICATION_ICON;
  const unread = notification.readAt === null;

  return (
    <li>
      <div
        className={cn(
          "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent",
          unread && "bg-accent/40",
        )}
      >
        <button
          type="button"
          onClick={onClick}
          className="flex flex-1 items-start gap-3 text-left min-w-0"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4">
            <Icon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "min-w-0 truncate text-sm",
                  unread ? "font-semibold" : "font-medium",
                )}
              >
                {notification.title}
              </span>
              {unread && (
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full bg-primary-strong"
                />
              )}
            </span>
            {notification.body && (
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {notification.body}
              </span>
            )}
          </span>
        </button>
        <span className="mt-1 shrink-0 whitespace-nowrap text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="mt-1 shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
          aria-label="Delete notification"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
