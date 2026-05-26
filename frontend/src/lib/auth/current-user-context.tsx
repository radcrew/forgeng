"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import { mockUsers } from "@/lib/mock-data";
import type { UserProfile, UserRole } from "@/lib/types";

const STORAGE_KEY = "forgeng.activeUserId";
const CHANGE_EVENT = "forgeng:current-user-change";

/**
 * Active-user state is persisted in `localStorage` so the role survives a
 * reload, and shared via `useSyncExternalStore` so the hook tree stays in
 * sync across multiple tabs as well.
 *
 * When real auth (Auth.js / Clerk) is wired in, only this provider needs to
 * change — `useCurrentUser`, `RoleGuard`, and every consumer keep working.
 */
export interface CurrentUserContextValue {
  user: UserProfile | null;
  /** False during SSR + the first client render, true once mounted. */
  isHydrated: boolean;
  signInAs: (role: UserRole) => UserProfile | null;
  signInAsUser: (user: UserProfile) => void;
  signOut: () => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

function readStoredUserId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) ? id : null;
}

function writeStoredUserId(id: number | null): void {
  if (typeof window === "undefined") return;
  if (id == null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, String(id));
  }
  // `storage` only fires across tabs; emit our own event for same-tab updates.
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getUserIdSnapshot(): number | null {
  return readStoredUserId();
}
function getUserIdServerSnapshot(): null {
  return null;
}

function getHydratedSnapshot(): boolean {
  return true;
}
function getHydratedServerSnapshot(): boolean {
  return false;
}

function findUserById(id: number): UserProfile | null {
  return mockUsers.find((u) => u.id === id) ?? null;
}

function findUserByRole(role: UserRole): UserProfile | null {
  return mockUsers.find((u) => u.role === role) ?? null;
}

export function CurrentUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = useSyncExternalStore(
    subscribe,
    getUserIdSnapshot,
    getUserIdServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribe,
    getHydratedSnapshot,
    getHydratedServerSnapshot,
  );

  const user = useMemo(
    () => (userId != null ? findUserById(userId) : null),
    [userId],
  );

  const signInAsUser = useCallback((next: UserProfile) => {
    writeStoredUserId(next.id);
  }, []);

  const signInAs = useCallback((role: UserRole): UserProfile | null => {
    const found = findUserByRole(role);
    if (found) writeStoredUserId(found.id);
    return found;
  }, []);

  const signOut = useCallback(() => {
    writeStoredUserId(null);
  }, []);

  const value = useMemo<CurrentUserContextValue>(
    () => ({ user, isHydrated, signInAs, signInAsUser, signOut }),
    [user, isHydrated, signInAs, signInAsUser, signOut],
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
