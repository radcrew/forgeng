import type { UserProfile } from "@types";

const SESSION_KEY = "forgeng.session";

/**
 * Every `forgeng.`-prefixed localStorage key is treated as user-scoped and
 * removed on sign-out (session, application drafts, …). Keep device-scoped
 * preferences (e.g. theme) outside this prefix.
 */
const USER_SCOPED_KEY_PREFIX = "forgeng.";
/** Application drafts written before they moved under the prefix above. */
const LEGACY_DRAFT_KEY_PREFIX = "apprenticeship_application_draft";

const removeUserScopedKeys = (): void => {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (
      key &&
      (key.startsWith(USER_SCOPED_KEY_PREFIX) ||
        key.startsWith(LEGACY_DRAFT_KEY_PREFIX))
    ) {
      keys.push(key);
    }
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
};

/** Cached snapshot so useSyncExternalStore getSnapshot stays referentially stable. */
let cachedRaw: string | null | undefined;
let cachedUser: UserProfile | null = null;

/**
 * Bumped on every write. A request that started before a sign-in can only
 * settle after it, and its failure handler must not clear the session that
 * sign-in just wrote — comparing versions tells it the session moved on.
 */
let version = 0;

export const sessionVersion = (): number => version;

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
    removeUserScopedKeys();
    cachedRaw = null;
    cachedUser = null;
  } else {
    const raw = JSON.stringify(user);
    window.localStorage.setItem(SESSION_KEY, raw);
    window.localStorage.setItem("forgeng.activeUserId", String(user.id));
    cachedRaw = raw;
    cachedUser = user;
  }
  version += 1;
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

/** Clear everything — used by signOut and on hard auth failures. */
export const clearAuth = (): void => {
  writeSession(null);
};
