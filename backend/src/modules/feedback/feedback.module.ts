import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [NotificationsModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  // Slack's Approve form saves reviews through the same service.
  exports: [FeedbackService],
})
export class FeedbackModule {}
