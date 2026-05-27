export const readStorageJson = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const writeStorageJson = (key: string, value: unknown): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const removeStorageItem = (key: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
};
