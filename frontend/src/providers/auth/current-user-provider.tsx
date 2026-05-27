"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { CurrentUserContext } from "@contexts/auth/current-user-context";
import type { CurrentUserContextValue } from "@contexts/auth/current-user-context";
import { getMe, signInWithEmail } from "@features/auth";
import { readSession, subscribeSession, writeSession } from "@lib/session";
import type { UserProfile } from "@types";

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
    () => ({
      user,
      isHydrated,
      signInWithEmail,
      signInAsUser,
      signOut,
      refreshUser,
    }),
    [user, isHydrated, signInAsUser, signOut, refreshUser],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}
