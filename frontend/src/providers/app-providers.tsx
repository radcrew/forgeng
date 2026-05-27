"use client";

import { TooltipProvider } from "@components/ui/tooltip";

import { CurrentUserProvider } from "./auth/current-user-provider";

/**
 * Client-side providers for the root layout. Add new global providers here.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CurrentUserProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </CurrentUserProvider>
  );
}
