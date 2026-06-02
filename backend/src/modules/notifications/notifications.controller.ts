import {
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
import type { NotificationDto } from '@common/mappers';
import { ListNotificationsQuery } from './dto/list-notifications.query';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Roles('student')
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
