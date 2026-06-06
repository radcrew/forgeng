import { Module } from '@nestjs/common';
import { MailModule } from '@core/mail';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { VideoService } from './video.service';

@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, VideoService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
