import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { Roles } from '@core/auth/roles.decorator';
import type { AuthUser } from '@core/auth/auth.types';
import type {
  NotificationDto,
  NotificationPreferenceDto,
} from '@common/mappers';
import { ListNotificationsQuery } from './dto/list-notifications.query';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Roles('student', 'admin')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListNotificationsQuery,
  ): Promise<NotificationDto[]> {
    return this.service.list(user, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser): Promise<{ count: number }> {
    return this.service.unreadCount(user);
  }

  @Get('preferences')
  getPreferences(
    @CurrentUser() user: AuthUser,
  ): Promise<NotificationPreferenceDto> {
    return this.service.getPreferences(user);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferenceDto> {
    return this.service.updatePreferences(user, dto);
  }

  @Patch('read')
  markAllRead(@CurrentUser() user: AuthUser): Promise<{ count: number }> {
    return this.service.markAllRead(user);
  }

  @Patch(':id/read')
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<NotificationDto> {
    return this.service.markRead(id, user);
  }
}
