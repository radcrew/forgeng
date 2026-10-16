import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@components/ui/button";

/**
 * A short note above the dashboard when the profile is incomplete. It sits
 * on top of the dashboard instead of replacing it, so tasks stay visible.
 */
export function ProfileReminder() {
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30"
    >
      <p className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Your profile is incomplete. Finish it so we can reach you.
      </p>
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <Link href="/student/profile">Complete Your Profile</Link>
      </Button>
    </div>
  );
}
