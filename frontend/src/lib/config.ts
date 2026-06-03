import { buildApiBase } from "@utils/api";

/** NestJS server origin (no trailing slash). */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Global API prefix from `backend/src/main.ts`. */
export const API_BASE = buildApiBase(API_URL);

/**
 * Resolve a stored asset path to a loadable URL. Absolute URLs (legacy
 * pasted avatar links) pass through; server-relative paths like
 * `/api/uploads/avatars/x.png` are prefixed with the API origin.
 */
export const resolveAssetUrl = (url: string): string =>
  /^https?:\/\//i.test(url) ? url : `${API_URL}${url}`;
