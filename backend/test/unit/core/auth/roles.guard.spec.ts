import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { RolesGuard } from '@core/auth/roles.guard';

function makeContext(user?: { role: Role }): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function makeGuard(required: Role[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('allows the request when no roles are required', () => {
    const guard = makeGuard(undefined);
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('allows the request when the required list is empty', () => {
    const guard = makeGuard([]);
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('forbids an unauthenticated request to a role-restricted route', () => {
    const guard = makeGuard(['admin']);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('forbids a user whose role is not allowed', () => {
    const guard = makeGuard(['admin']);
    expect(() => guard.canActivate(makeContext({ role: 'student' }))).toThrow(
      ForbiddenException,
    );
  });

  it('allows a user whose role is in the required list', () => {
    const guard = makeGuard(['admin', 'student']);
    expect(guard.canActivate(makeContext({ role: 'student' }))).toBe(true);
  });
});
