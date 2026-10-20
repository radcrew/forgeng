import { Module } from '@nestjs/common';
import { SlackCronController } from './slack-cron.controller';
import { SlackEventsController } from './slack-events.controller';
import { SlackMembersService } from './slack-members.service';

/**
 * Slack's events, and the nightly channel check. Posting to Slack is in
 * core/slack.
 */
@Module({
  controllers: [SlackEventsController, SlackCronController],
  providers: [SlackMembersService],
})
export class SlackEventsModule {}
