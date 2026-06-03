import { Module } from '@nestjs/common';

import { CoreAuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';

/** Global infrastructure: database, authentication guards, email transport. */
@Module({
  imports: [DatabaseModule, CoreAuthModule, MailModule],
  exports: [DatabaseModule, CoreAuthModule, MailModule],
})
export class CoreModule {}
