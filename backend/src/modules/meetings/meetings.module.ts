import { Module } from '@nestjs/common';
import { GoogleCalendarAuthService } from './google-calendar-auth.service';
import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleCalendarService } from './google-calendar.service';

@Module({
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarAuthService, GoogleCalendarService],
})
export class MeetingsModule {}
