import { jwtVerify } from "jose";

import type { UserRole } from "@types";

export const ACCESS_COOKIE_NAME = "forgeng_access";

export interface AccessTokenPayload {
  sub: number;
  email: string;
  role: UserRole;
}

/** Verifies an access token cookie. Returns `null` on any verification failure. */
export const verifyAccessToken = async (
  token: string,
): Promise<AccessTokenPayload | null> => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (
      typeof payload.sub !== "string" && typeof payload.sub !== "number"
    ) {
      return null;
    }
    if (typeof payload.email !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return {
      sub: Number(payload.sub),
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
};
