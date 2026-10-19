import { Module } from '@nestjs/common';
import { GoogleCalendarAuthService } from './google-calendar-auth.service';
import { GoogleCalendarController } from './google-calendar.controller';

@Module({
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarAuthService],
})
export class MeetingsModule {}
