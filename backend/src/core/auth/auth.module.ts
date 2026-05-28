import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Registers JWT auth + role guards as global `APP_GUARD`s.
 * Routes opt out via `@Public()` or constrain via `@Roles()`.
 */
@Global()
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class CoreAuthModule {}
