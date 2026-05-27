import type { UserProfile } from "@lib/types";

const SESSION_KEY = "forgeng.session";

export function readSession(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function writeSession(user: UserProfile | null): void {
  if (typeof window === "undefined") return;
  if (user == null) {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem("forgeng.activeUserId");
  } else {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    window.localStorage.setItem("forgeng.activeUserId", String(user.id));
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
