import type { UserProfile } from "@types";

const SESSION_KEY = "forgeng.session";
const ACCESS_TOKEN_KEY = "forgeng.accessToken";

/** Cached snapshot so useSyncExternalStore getSnapshot stays referentially stable. */
let cachedRaw: string | null | undefined;
let cachedUser: UserProfile | null = null;

export const readSession = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw === cachedRaw) {
    return cachedUser;
  }
  cachedRaw = raw;
  if (!raw) {
    cachedUser = null;
    return null;
  }
  try {
    cachedUser = JSON.parse(raw) as UserProfile;
    return cachedUser;
  } catch {
    cachedRaw = null;
    cachedUser = null;
    return null;
  }
};

export const writeSession = (user: UserProfile | null): void => {
  if (typeof window === "undefined") return;
  if (user == null) {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem("forgeng.activeUserId");
    cachedRaw = null;
    cachedUser = null;
  } else {
    const raw = JSON.stringify(user);
    window.localStorage.setItem(SESSION_KEY, raw);
    window.localStorage.setItem("forgeng.activeUserId", String(user.id));
    cachedRaw = raw;
    cachedUser = user;
  }
  window.dispatchEvent(new Event("forgeng:session-change"));
};

export const subscribeSession = (callback: () => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("forgeng:session-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("forgeng:session-change", callback);
  };
};

/**
 * Access token storage. The token also lives in localStorage so a hard reload
 * doesn't bounce the user back to /sign-in before the refresh-cookie round
 * trip — but it is short-lived (15m by default) and rotated via /auth/refresh.
 */
export const readAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const writeAccessToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  if (token === null) {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } else {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

/** Clear everything — used by signOut and on hard auth failures. */
export const clearAuth = (): void => {
  writeAccessToken(null);
  writeSession(null);
};
