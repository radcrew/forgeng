import { ApiError } from "@lib/api-client";
import type { UserProfile } from "@types";

const ACCESS_RESTRICTION_REASONS: Record<string, "region" | "vpn"> = {
  REGION_BLOCKED: "region",
  VPN_DETECTED: "vpn",
};

/** Maps a region/VPN restriction error to its `/unavailable?reason=` value, or null. */
export const accessRestrictionReason = (err: unknown): "region" | "vpn" | null => {
  if (!(err instanceof ApiError) || err.status !== 403) return null;
  const code = (err.body as { code?: string } | undefined)?.code;
  return code ? (ACCESS_RESTRICTION_REASONS[code] ?? null) : null;
};

/** Default landing page for a given role (used by the role guard + sign-in). */
export const homeForRole = (role: UserProfile["role"]): string => {
  switch (role) {
    case "student":
      return "/student";
    case "admin":
      return "/admin";
    case "applicant":
    default:
      return "/apply";
  }
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
