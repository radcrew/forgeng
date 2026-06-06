/** Human-readable label from snake_case status values. */
export const formatStatusLabel = (status: string) =>
  status.replace(/_/g, " ");

/** Two-character initials from a display name or email fallback. */
export const initials = (name: string | null, email: string) =>
  (name?.trim() || email).slice(0, 2).toUpperCase();
