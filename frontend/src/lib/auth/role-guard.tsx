"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Skeleton } from "@components/ui/skeleton";
import { useCurrentUser } from "@contexts";
import type { UserRole } from "@types";

import { homeForRole } from "@utils/auth";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  /** Where to send signed-out visitors. Defaults to `/sign-in`. */
  signInPath?: string;
}

/**
 * Client-side route guard. Mount it inside a layout to protect every page
 * below it.
 *
 * - Signed-out users are redirected to `signInPath`.
 * - Wrong-role users are bounced to their own role's home page with a toast.
 * - During hydration, a small skeleton is rendered to avoid the flash of
 *   "redirecting" content before localStorage has been read.
 *
 * The guard is intentionally cosmetic: real authorization happens on the
 * NestJS side. This is just to keep navigation honest.
 */
export function RoleGuard({
  allowedRoles,
  children,
  signInPath = "/sign-in",
}: RoleGuardProps) {
  const { user, isHydrated } = useCurrentUser();
  const router = useRouter();

  const allowed = user != null && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace(signInPath);
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      toast.error("You don't have access to that page.");
      router.replace(homeForRole(user.role));
    }
  }, [isHydrated, user, allowedRoles, router, signInPath]);

  if (!isHydrated || !allowed) {
    return <RoleGuardFallback />;
  }
  return <>{children}</>;
}

function RoleGuardFallback() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
