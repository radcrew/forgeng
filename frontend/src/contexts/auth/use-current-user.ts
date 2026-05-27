"use client";

import { useContext } from "react";

import {
  CurrentUserContext,
  type CurrentUserContextValue,
} from "./current-user-context";

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error(
      "useCurrentUser must be used inside <CurrentUserProvider />.",
    );
  }
  return ctx;
}

export type { CurrentUserContextValue } from "./current-user-context";
