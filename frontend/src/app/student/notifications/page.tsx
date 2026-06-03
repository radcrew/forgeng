"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { ClickableCard, LoadingState } from "@components/common";
import { Button } from "@components/ui/button";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { cn } from "@utils";
import type { Notification } from "@types";
import {
  FALLBACK_NOTIFICATION_ICON,
  NOTIFICATION_ICONS,
  NotificationPreferencesCard,
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
} from "@features/notifications";

const Page = () => {
  const router = useRouter();
  const { data = [], isLoading, error, refetch } = useNotifications();
  const [busy, setBusy] = useState(false);

  const hasUnread = data.some((n) => n.readAt === null);

  const handleClick = async (notification: Notification) => {
    if (notification.readAt === null) {
      try {
        await markNotificationRead(notification.id);
        refetch();
      } catch {
        // Navigation should still proceed even if the read flag fails to save.
      }
    }
    if (notification.link) router.push(notification.link);
  };

  const handleMarkAllRead = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      refetch();
    } catch {
      toast.error("Couldn't mark notifications as read.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title="Notifications"
        description="Updates on your feedback and new tasks."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleMarkAllRead}
            disabled={busy || !hasUnread}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        }
      />

      <NotificationPreferencesCard />

      {isLoading ? (
        <LoadingState message="Loading notifications…" />
      ) : error ? (
        <EmptyState>
          <p>Couldn&apos;t load notifications.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={refetch}
          >
            Try again
          </Button>
        </EmptyState>
      ) : data.length === 0 ? (
        <EmptyState message="You have no notifications yet." />
      ) : (
        <div className="space-y-3">
          {data.map((notification) => {
            const Icon =
              NOTIFICATION_ICONS[notification.type] ??
              FALLBACK_NOTIFICATION_ICON;
            const unread = notification.readAt === null;
            return (
              <ClickableCard
                key={notification.id}
                onClick={() => void handleClick(notification)}
                className={cn(unread && "border-primary/40 bg-accent/30")}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
                  <Icon />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "truncate",
                        unread ? "font-semibold" : "font-medium",
                      )}
                    >
                      {notification.title}
                    </p>
                    {unread && (
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full bg-primary"
                      />
                    )}
                  </div>
                  {notification.body && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {notification.body}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </ClickableCard>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default Page;
