/** NestJS API base URL (no trailing slash). */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * When true (default), feature `api` modules read from `lib/mock-data`.
 * Set `NEXT_PUBLIC_USE_MOCK_DATA=false` to call the live API.
 */
export const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
