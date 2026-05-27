import type { UserProfile } from "@types";

const SESSION_KEY = "forgeng.session";

/** Cached snapshot so useSyncExternalStore getSnapshot stays referentially stable. */
let cachedRaw: string | null | undefined;
let cachedUser: UserProfile | null = null;

export function readSession(): UserProfile | null {
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
}

export function writeSession(user: UserProfile | null): void {
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
}

export function subscribeSession(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("forgeng:session-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("forgeng:session-change", callback);
  };
}
