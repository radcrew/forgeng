import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { AuthUser } from '../../core/auth/auth.types';
import { CurrentUser } from '../../core/auth/current-user.decorator';
import { Roles } from '../../core/auth/roles.decorator';
import { UpdateBookingUrlDto } from './dto/update-booking-url.dto';
import {
  MentorsService,
  type BookingUrlDto,
  type MentorDto,
} from './mentors.service';

@ApiTags('mentors')
@Controller('mentors')
export class MentorsController {
  constructor(private readonly service: MentorsService) {}

  // Not applicants: only accepted students can book a mentor.
  @Roles('student', 'admin')
  @Get()
  list(): Promise<MentorDto[]> {
    return this.service.list();
  }

  @Roles('admin')
  @Get('me/booking-url')
  getBookingUrl(@CurrentUser() user: AuthUser): Promise<BookingUrlDto> {
    return this.service.getBookingUrl(user.id);
  }

  @Roles('admin')
  @Patch('me/booking-url')
  updateBookingUrl(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateBookingUrlDto,
  ): Promise<BookingUrlDto> {
    return this.service.updateBookingUrl(user.id, dto.bookingUrl);
  }
}
