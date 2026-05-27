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
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@core/auth/current-user.decorator';
import type { AuthUser } from '@core/auth/auth.types';
import { Roles } from '@core/auth/roles.decorator';
import type { FeedbackDto } from '@common/mappers';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('feedback')
@Controller('submissions/:id/feedback')
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Get()
  list(@Param('id', ParseIntPipe) id: number): Promise<FeedbackDto[]> {
    return this.service.list(id);
  }

  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() reviewer: AuthUser,
    @Body() dto: CreateFeedbackDto,
  ): Promise<FeedbackDto> {
    return this.service.create(id, reviewer, dto);
  }
}
