import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  verifyAccessToken,
  type AccessTokenPayload,
} from "@lib/auth/access-token";
import { homeForRole } from "@utils/auth";
import type { UserRole } from "@types";

// `??` is wrong here: deployments set NEXT_PUBLIC_API_URL="" so the browser
// calls same-origin /api/... (see lib/config.ts), and an empty string is not
// nullish, so it would win and leave this server-side fetch with a relative
// URL it cannot parse. `||` keeps the absolute fallback. BACKEND_ORIGIN is the
// same rewrite target next.config.ts uses.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_ORIGIN ||
  "https://forgeng-backend.onrender.com";

const PROTECTED_ROUTES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/student", roles: ["student"] },
  { prefix: "/apply", roles: ["applicant"] },
];

const AUTH_PAGES = ["/sign-in", "/sign-up", "/forgot-password"];

const matchesPrefix = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedRoute = PROTECTED_ROUTES.find((route) =>
    matchesPrefix(pathname, route.prefix),
  );
  const isAuthPage = AUTH_PAGES.some((page) => matchesPrefix(pathname, page));

  if (!protectedRoute && !isAuthPage) {
    return NextResponse.next();
  }

  let payload: AccessTokenPayload | null = null;
  let setCookieHeaders: string[] = [];

  const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (accessToken) {
    payload = await verifyAccessToken(accessToken);
  }

  if (!payload) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const refreshed = await attemptRefresh(cookieHeader);
      if (refreshed) {
        payload = refreshed.payload;
        setCookieHeaders = refreshed.setCookieHeaders;
      }
    }
  }

  if (protectedRoute) {
    if (!payload) {
      return redirectWithCookies(req, "/sign-in", setCookieHeaders);
    }
    if (!protectedRoute.roles.includes(payload.role)) {
      return redirectWithCookies(req, homeForRole(payload.role), setCookieHeaders);
    }
  }

  if (isAuthPage && payload) {
    return redirectWithCookies(req, homeForRole(payload.role), setCookieHeaders);
  }

  const res = NextResponse.next();
  applySetCookies(res, setCookieHeaders);
  return res;
}

interface RefreshResult {
  payload: AccessTokenPayload;
  setCookieHeaders: string[];
}

/** Forwards the request's cookies to /auth/refresh and verifies the rotated access token. */
async function attemptRefresh(cookieHeader: string): Promise<RefreshResult | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return null;

    const setCookieHeaders = res.headers.getSetCookie();
    const accessToken = setCookieHeaders
      .map((header) => readCookieValue(header, ACCESS_COOKIE_NAME))
      .find((value): value is string => value != null);
    if (!accessToken) return null;

    const payload = await verifyAccessToken(accessToken);
    if (!payload) return null;

    return { payload, setCookieHeaders };
  } catch {
    return null;
  }
}

function readCookieValue(setCookieHeader: string, name: string): string | null {
  const [pair] = setCookieHeader.split(";");
  const separatorIndex = pair.indexOf("=");
  if (separatorIndex === -1) return null;
  const key = pair.slice(0, separatorIndex).trim();
  if (key !== name) return null;
  return pair.slice(separatorIndex + 1).trim();
}

function redirectWithCookies(
  req: NextRequest,
  path: string,
  setCookieHeaders: string[],
): NextResponse {
  const res = NextResponse.redirect(new URL(path, req.url));
  applySetCookies(res, setCookieHeaders);
  return res;
}

function applySetCookies(res: NextResponse, setCookieHeaders: string[]): void {
  for (const header of setCookieHeaders) {
    res.headers.append("Set-Cookie", header);
  }
}

export const config = {
  // `api` is excluded so the rewrite to the backend isn't wrapped in a proxy
  // pass on every request; nothing under /api is a protected page anyway.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
