import type { Role, User } from '@prisma/client';
import type { Request } from 'express';

export type AuthRole = Role;

/**
 * The authenticated user attached to every request that passes the auth guard.
 * Mirrors `usersTable.$inferSelect` from the original Drizzle backend.
 */
export type AuthUser = User;

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
