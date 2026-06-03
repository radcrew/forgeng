"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet";
import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@utils";
import type { Notification } from "@types";

import { markAllNotificationsRead, markNotificationRead } from "../api";
import { useNotifications, useUnreadNotificationCount } from "../hooks";
import { FALLBACK_NOTIFICATION_ICON, NOTIFICATION_ICONS } from "../icons";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { count, setCount, refresh } = useUnreadNotificationCount();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            count > 0 ? `Notifications, ${count} unread` : "Notifications"
          }
        >
          <Bell />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none"
            >
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>

        {open && (
          <NotificationPanel
            onCountChange={setCount}
            onRefreshCount={() => void refresh()}
            onNavigate={() => setOpen(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface NotificationPanelProps {
  onCountChange: (count: number) => void;
  onRefreshCount: () => void;
  onNavigate: () => void;
}

function NotificationPanel({
  onCountChange,
  onRefreshCount,
  onNavigate,
}: NotificationPanelProps) {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useNotifications();
  const [busy, setBusy] = useState(false);

  const notifications = data ?? [];
  const hasUnread = notifications.some((n) => n.readAt === null);

  const handleItemClick = async (notification: Notification) => {
    if (notification.readAt === null) {
      try {
        await markNotificationRead(notification.id);
        refetch();
        onRefreshCount();
      } catch {
        // Navigation should still proceed even if the read flag fails to save.
      }
    }
    if (notification.link) {
      onNavigate();
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      onCountChange(0);
      refetch();
    } catch {
      toast.error("Couldn't mark notifications as read.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs text-muted-foreground">
          {notifications.length > 0
            ? `${notifications.length} total`
            : "All caught up"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={handleMarkAllRead}
          disabled={busy || !hasUnread}
        >
          <CheckCheck />
          Mark all read
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <PanelSkeleton />
        ) : error ? (
          <PanelMessage>
            Couldn&apos;t load notifications.{" "}
            <button
              type="button"
              onClick={refetch}
              className="text-primary underline-offset-4 hover:underline"
            >
              Try again
            </button>
          </PanelMessage>
        ) : notifications.length === 0 ? (
          <PanelMessage>You have no notifications yet.</PanelMessage>
        ) : (
          <ul className="divide-y">
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onClick={() => void handleItemClick(notification)}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="border-t p-2">
        <SheetClose asChild>
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/student/notifications">View all notifications</Link>
          </Button>
        </SheetClose>
      </div>
    </>
  );
}

interface NotificationRowProps {
  notification: Notification;
  onClick: () => void;
}

function NotificationRow({ notification, onClick }: NotificationRowProps) {
  const Icon =
    NOTIFICATION_ICONS[notification.type] ?? FALLBACK_NOTIFICATION_ICON;
  const unread = notification.readAt === null;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
          unread && "bg-accent/40",
        )}
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4">
          <Icon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-sm",
                unread ? "font-semibold" : "font-medium",
              )}
            >
              {notification.title}
            </span>
            {unread && (
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full bg-primary"
              />
            )}
          </span>
          {notification.body && (
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
              {notification.body}
            </span>
          )}
          <span className="mt-1 block text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </span>
        </span>
      </button>
    </li>
  );
}

function PanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-1 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-2">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
