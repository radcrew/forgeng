import { Global, Module } from '@nestjs/common';

import { MailService } from './mail.service';

/** Global transactional email transport shared by every feature module. */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
