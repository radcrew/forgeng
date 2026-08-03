"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ClickableCard, LoadingState } from "@components/common";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import { cn } from "@utils";
import type { Notification } from "@types";
import {
  FALLBACK_NOTIFICATION_ICON,
  NOTIFICATION_ICONS,
  NotificationPreferencesCard,
  deleteAllNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
} from "@features/notifications";

const Page = () => {
  const router = useRouter();
  const { data = [], isLoading, error, refetch } = useNotifications();
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification(id);
      refetch();
    } catch {
      toast.error("Couldn't delete notification.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setBusy(true);
    try {
      await deleteAllNotifications();
      refetch();
    } catch {
      toast.error("Couldn't clear notifications.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        description="Updates on your feedback and new tasks."
        actions={
          <div className="flex gap-2">
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={handleDeleteAll}
              disabled={busy || data.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          </div>
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
        <EmptyState message="You have no notifications yet." art={APP_ART.notifications} />
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
                className={cn(unread && "border-primary-strong/40 bg-accent/30")}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
                  <Icon />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "min-w-0 truncate",
                        unread ? "font-semibold" : "font-medium",
                      )}
                    >
                      {notification.title}
                    </p>
                    <Badge
                      variant="outline"
                      className="shrink-0 whitespace-nowrap font-normal text-muted-foreground"
                    >
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </Badge>
                    {unread && (
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full bg-primary-strong"
                      />
                    )}
                  </div>
                  {notification.body && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {notification.body}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === notification.id}
                  onClick={(e) => void handleDelete(e, notification.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </ClickableCard>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default Page;
