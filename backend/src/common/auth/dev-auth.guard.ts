import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedRequest, AuthUser } from './auth.types';
import { IS_PUBLIC_KEY } from './public.decorator';

const VALID_ROLES: Role[] = ['applicant', 'student', 'mentor', 'admin'];

function asRole(value: unknown): Role | undefined {
  return typeof value === 'string' && (VALID_ROLES as string[]).includes(value)
    ? (value as Role)
    : undefined;
}

/**
 * Header-based dev authentication.
 *
 * Reads `x-user-id`, `x-user-email`, and optional `x-user-role` from the
 * request and upserts the matching user record. Swap this guard for a real
 * Clerk / OIDC implementation later — the rest of the API depends only on the
 * `request.user` contract provided here.
 */
@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headers = req.headers;

    const rawId = headers['x-user-id'];
    const userIdStr = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = userIdStr ? Number.parseInt(userIdStr, 10) : NaN;

    let user: AuthUser | null = null;

    if (Number.isFinite(userId)) {
      user = await this.prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user) {
      const rawEmail = headers['x-user-email'];
      const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
      if (email) {
        const rawRole = headers['x-user-role'];
        const roleHeader = Array.isArray(rawRole) ? rawRole[0] : rawRole;
        const role = asRole(roleHeader) ?? 'applicant';
        user = await this.prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, role },
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException(
        'Provide x-user-id or x-user-email header.',
      );
    }

    req.user = user;
    return true;
  }
}
