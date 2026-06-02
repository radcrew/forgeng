import { Module } from '@nestjs/common';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [NotificationsModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
