import { Global, Module } from '@nestjs/common';

import { SlackService } from './slack.service';

/** Global Slack poster shared by every feature module. */
@Global()
@Module({
  providers: [SlackService],
  exports: [SlackService],
})
export class SlackModule {}
