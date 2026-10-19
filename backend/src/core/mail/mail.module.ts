import { Global, Module } from '@nestjs/common';

import { EmailRetryController } from './email-retry.controller';
import { MailService } from './mail.service';

/** Global transactional email transport shared by every feature module. */
@Global()
@Module({
  controllers: [EmailRetryController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
