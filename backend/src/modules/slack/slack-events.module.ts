import { Module } from '@nestjs/common';
import { FeedbackModule } from '../feedback/feedback.module';
import { SlackCronController } from './slack-cron.controller';
import { SlackEventsController } from './slack-events.controller';
import { SlackInteractionsController } from './slack-interactions.controller';
import { SlackMembersService } from './slack-members.service';
import { SlackReviewsService } from './slack-reviews.service';

/**
 * Slack's events and interactions, and the nightly channel check. Posting
 * to Slack is in core/slack.
 */
@Module({
  imports: [FeedbackModule],
  controllers: [
    SlackEventsController,
    SlackInteractionsController,
    SlackCronController,
  ],
  providers: [SlackMembersService, SlackReviewsService],
})
export class SlackEventsModule {}
