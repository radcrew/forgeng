import { Global, Module } from '@nestjs/common';

import { SlackChannelsService } from './slack-channels.service';
import { SlackService } from './slack.service';

/** Global Slack poster and channel sync, shared by every feature module. */
@Global()
@Module({
  providers: [SlackService, SlackChannelsService],
  exports: [SlackService, SlackChannelsService],
})
export class SlackModule {}
