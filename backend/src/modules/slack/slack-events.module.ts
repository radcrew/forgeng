import { Module } from '@nestjs/common';
import { SlackEventsController } from './slack-events.controller';
import { SlackMembersService } from './slack-members.service';

/** Events that Slack sends to Forgeng. Posting to Slack is in core/slack. */
@Module({
  controllers: [SlackEventsController],
  providers: [SlackMembersService],
})
export class SlackEventsModule {}
