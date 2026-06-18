"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet";
import { useCurrentUser } from "@contexts";

import { useUnreadNotificationCount } from "../hooks";
import { NotificationPanel } from "./notification-panel";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUser();
  const viewAllHref =
    user?.role === "admin" ? "/admin/notifications" : "/student/notifications";
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
            viewAllHref={viewAllHref}
            onCountChange={setCount}
            onRefreshCount={() => void refresh()}
            onNavigate={() => setOpen(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
