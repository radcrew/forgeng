import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { Roles } from '../common/auth/roles.decorator';
import type { FeedbackDto } from '../common/serializers';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('submissions/:id/feedback')
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Get()
  list(@Param('id', ParseIntPipe) id: number): Promise<FeedbackDto[]> {
    return this.service.list(id);
  }

  @Roles('mentor', 'admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() mentor: AuthUser,
    @Body() dto: CreateFeedbackDto,
  ): Promise<FeedbackDto> {
    return this.service.create(id, mentor, dto);
  }
}
