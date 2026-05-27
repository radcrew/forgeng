"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import { getMe, signInWithDevRole } from "@features/auth";
import { readSession, subscribeSession, writeSession } from "@lib/session";
import type { UserProfile, UserRole } from "@lib/types";

/**
 * Active-user state is persisted in `localStorage` and sent to the API via
 * dev auth headers. Replace with Clerk / Auth.js when production auth lands.
 */
export interface CurrentUserContextValue {
  user: UserProfile | null;
  /** False during SSR + the first client render, true once mounted. */
  isHydrated: boolean;
  signInAs: (role: UserRole) => Promise<UserProfile | null>;
  signInAsUser: (user: UserProfile) => void;
  signOut: () => void;
  refreshUser: () => Promise<UserProfile | null>;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

function getUserSnapshot(): UserProfile | null {
  return readSession();
}

function getUserServerSnapshot(): null {
  return null;
}

function getHydratedSnapshot(): boolean {
  return true;
}

function getHydratedServerSnapshot(): boolean {
  return false;
}

export function CurrentUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useSyncExternalStore(
    subscribeSession,
    getUserSnapshot,
    getUserServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribeSession,
    getHydratedSnapshot,
    getHydratedServerSnapshot,
  );

  const signInAsUser = useCallback((next: UserProfile) => {
    writeSession(next);
  }, []);

  const signInAs = useCallback(
    (role: UserRole) => signInWithDevRole(role),
    [],
  );

  const signOut = useCallback(() => {
    writeSession(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const session = readSession();
    if (!session) return null;
    try {
      const me = await getMe();
      writeSession(me);
      return me;
    } catch {
      writeSession(null);
      return null;
    }
  }, []);

  const value = useMemo<CurrentUserContextValue>(
    () => ({ user, isHydrated, signInAs, signInAsUser, signOut, refreshUser }),
    [user, isHydrated, signInAs, signInAsUser, signOut, refreshUser],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error(
      "useCurrentUser must be used inside <CurrentUserProvider />.",
    );
  }
  return ctx;
}

/** Default landing page for a given role (used by the role guard + sign-in). */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case "student":
      return "/student";
    case "mentor":
      return "/mentor";
    case "admin":
      return "/admin";
    case "applicant":
    default:
      return "/apply";
  }
}
