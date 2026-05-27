import { readSession } from "@lib/session";

/** Strip trailing slash and append the NestJS global `/api` prefix. */
export const buildApiBase = (origin: string): string =>
  `${origin.replace(/\/$/, "")}/api`;

/** Dev auth headers matching the NestJS `DevAuthGuard` contract. */
export const getDevAuthHeaders = (): Record<string, string> => {
  const session = readSession();
  if (!session) return {};

  return {
    "x-user-email": session.email,
    "x-user-role": session.role,
    ...(session.id > 0 && { "x-user-id": String(session.id) }),
  };
};
