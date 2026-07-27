import { buildApiBase } from "@utils/api";

/**
 * NestJS server origin (no trailing slash) for browser requests. Empty means
 * "same origin": the browser calls relative `/api/...`, which next.config.ts
 * rewrites to the backend, so auth cookies stay first-party. Set this only for
 * local dev (e.g. http://localhost:3001), where there is no rewrite. In a
 * deployment leave it unset — a hardcoded backend origin here would make the
 * client call the API cross-origin and the auth cookies would never be sent.
 * (proxy.ts keeps its own absolute fallback; it runs on the server and cannot
 * use a relative URL.)
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Global API prefix from `backend/src/main.ts`. */
export const API_BASE = buildApiBase(API_URL);

/**
 * Resolve a stored asset path to a loadable URL. Absolute URLs (legacy
 * pasted avatar links) pass through; server-relative paths like
 * `/api/uploads/avatars/x.png` are prefixed with the API origin.
 */
export const resolveAssetUrl = (url: string): string =>
  /^https?:\/\//i.test(url) ? url : `${API_URL}${url}`;
