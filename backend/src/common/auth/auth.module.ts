import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DevAuthGuard } from './dev-auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Registers the dev auth + role guards as global APP_GUARDs.
 * Auth runs first; routes opt out via `@Public()` or constrain via `@Roles()`.
 */
@Global()
@Module({
  providers: [
    { provide: APP_GUARD, useClass: DevAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
