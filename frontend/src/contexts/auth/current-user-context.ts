"use client";

import { createContext } from "react";

import type { UserProfile } from "@types";

export interface CurrentUserContextValue {
  user: UserProfile | null;
  /** False during SSR + the first client render, true once mounted. */
  isHydrated: boolean;
  signInWithEmail: (email: string) => Promise<UserProfile>;
  signInAsUser: (user: UserProfile) => void;
  signOut: () => void;
  refreshUser: () => Promise<UserProfile | null>;
}

export const CurrentUserContext =
  createContext<CurrentUserContextValue | null>(null);
