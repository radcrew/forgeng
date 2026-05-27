import { Module } from '@nestjs/common';

import { CoreAuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';

/** Global infrastructure: database, authentication guards. */
@Module({
  imports: [DatabaseModule, CoreAuthModule],
  exports: [DatabaseModule, CoreAuthModule],
})
export class CoreModule {}
