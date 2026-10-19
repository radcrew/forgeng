import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { GoogleCalendarAuthService } from './google-calendar-auth.service';
import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleCalendarService } from './google-calendar.service';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [NotificationsModule],
  controllers: [GoogleCalendarController, MeetingsController],
  providers: [
    GoogleCalendarAuthService,
    GoogleCalendarService,
    MeetingsService,
  ],
})
export class MeetingsModule {}
