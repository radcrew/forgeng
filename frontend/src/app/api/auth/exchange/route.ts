import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  verifyAccessToken,
} from "@lib/auth/access-token";

/**
 * Cross-domain OAuth bridge.
 *
 * The backend cannot set httpOnly cookies on the Vercel domain, so after OAuth
 * it redirects here with the access token as ?token=. We verify it server-side
 * and set a Vercel-domain httpOnly cookie so the middleware can read it.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/sign-in", origin));
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/sign-in", origin));
  }

  const { protocol } = new URL(req.url);
  const res = NextResponse.redirect(new URL("/auth/callback", origin));
  res.cookies.set(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  return res;
}
