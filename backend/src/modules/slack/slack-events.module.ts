import { Module } from '@nestjs/common';
import { SlackEventsController } from './slack-events.controller';

/** Events that Slack sends to Forgeng. Posting to Slack is in core/slack. */
@Module({
  controllers: [SlackEventsController],
})
export class SlackEventsModule {}
