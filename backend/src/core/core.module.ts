import { Module } from '@nestjs/common';

import { CoreAuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';
import { SlackModule } from './slack/slack.module';

/** Global infrastructure: database, authentication guards, email, Slack. */
@Module({
  imports: [DatabaseModule, CoreAuthModule, MailModule, SlackModule],
  exports: [DatabaseModule, CoreAuthModule, MailModule, SlackModule],
})
export class CoreModule {}
