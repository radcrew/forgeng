"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import { CurrentUserContext } from "@contexts/auth/current-user-context";
import type { CurrentUserContextValue } from "@contexts/auth/current-user-context";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  oauthStartUrl,
  refresh as refreshSession,
  register as registerRequest,
  type OAuthProvider,
} from "@features/auth";
import { ApiError } from "@lib/api-client";
import { readSession, subscribeSession } from "@lib/session";
import type { UserProfile } from "@types";

const getUserSnapshot = (): UserProfile | null => readSession();

const getUserServerSnapshot = (): null => null;

const getHydratedSnapshot = (): boolean => true;

const getHydratedServerSnapshot = (): boolean => false;

export const CurrentUserProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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

  const login = useCallback(
    (email: string, password: string) => loginRequest(email, password),
    [],
  );

  const register = useCallback(
    async (input: { email: string; password: string; name?: string }) => {
      await registerRequest(input.email, input.password, input.name);
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      return await getMe();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return null;
      }
      throw err;
    }
  }, []);

  const startOAuth = useCallback((provider: OAuthProvider) => {
    if (typeof window === "undefined") return;
    window.location.assign(oauthStartUrl(provider));
  }, []);

  // First-mount rehydrate: the access token lives in an httpOnly cookie, so
  // confirm it's still valid by calling /auth/me. The api-client transparently
  // rotates via /auth/refresh on a 401, so a successful response also means
  // the refresh cookie is still good.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await getMe();
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          // api-client already cleared on hard refresh failure; nothing else to do.
          return;
        }
        // Network blip: try a one-shot explicit refresh as a fallback.
        await refreshSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      user,
      isHydrated,
      login,
      register,
      logout,
      refreshUser,
      startOAuth,
    }),
    [user, isHydrated, login, register, logout, refreshUser, startOAuth],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
};
