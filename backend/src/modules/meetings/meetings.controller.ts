import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { AuthUser } from '../../core/auth/auth.types';
import { CurrentUser } from '../../core/auth/current-user.decorator';
import { Roles } from '../../core/auth/roles.decorator';
import {
  ListMeetingsQuery,
  RescheduleMeetingDto,
  ScheduleMeetingDto,
} from './dto/meeting.dto';
import { MeetingsService, type MeetingDto } from './meetings.service';

@ApiTags('meetings')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly service: MeetingsService) {}

  @Roles('student', 'admin')
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListMeetingsQuery,
  ): Promise<MeetingDto[]> {
    return this.service.list(user, query);
  }

  @Roles('admin')
  @Post()
  schedule(
    @CurrentUser() user: AuthUser,
    @Body() dto: ScheduleMeetingDto,
  ): Promise<MeetingDto> {
    return this.service.schedule(user, dto);
  }

  @Roles('admin')
  @Patch(':id')
  reschedule(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleMeetingDto,
  ): Promise<MeetingDto> {
    return this.service.reschedule(user, id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MeetingDto> {
    return this.service.cancel(user, id);
  }
}
