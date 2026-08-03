"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { SheetClose } from "@components/ui/sheet";
import { Skeleton } from "@components/ui/skeleton";
import type { Notification } from "@types";

import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api";
import { useNotifications } from "../hooks";
import { NotificationRow } from "./notification-row";

export interface NotificationPanelProps {
  viewAllHref: string;
  onCountChange: (count: number) => void;
  onRefreshCount: () => void;
  onNavigate: () => void;
}

export function NotificationPanel({
  viewAllHref,
  onCountChange,
  onRefreshCount,
  onNavigate,
}: NotificationPanelProps) {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useNotifications();
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification(id);
      refetch();
      onRefreshCount();
    } catch {
      toast.error("Couldn't delete notification.");
    } finally {
      setDeletingId(null);
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
              className="text-primary-strong underline-offset-4 hover:underline"
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
                deleting={deletingId === notification.id}
                onClick={() => void handleItemClick(notification)}
                onDelete={(e) => void handleDelete(e, notification.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="border-t p-2">
        <SheetClose asChild>
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href={viewAllHref}>View all notifications</Link>
          </Button>
        </SheetClose>
      </div>
    </>
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
