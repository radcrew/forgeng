/** NestJS server origin (no trailing slash). */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Global API prefix from `backend/src/main.ts`. */
export const API_BASE = `${API_URL.replace(/\/$/, "")}/api`;
