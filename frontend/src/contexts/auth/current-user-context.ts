"use client";

import { createContext } from "react";

import type { OAuthProvider } from "@features/auth";
import type { UserProfile } from "@types";

export interface CurrentUserContextValue {
  user: UserProfile | null;
  /** False during SSR + the first client render, true once mounted. */
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (input: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
  startOAuth: (provider: OAuthProvider) => void;
}

export const CurrentUserContext =
  createContext<CurrentUserContextValue | null>(null);
